package com.ordereasy.order_service.service;

import com.ordereasy.order_service.dto.CreateOrderRequest;
import com.ordereasy.order_service.dto.DeliveryAssignmentRequest;
import com.ordereasy.order_service.dto.DeliveryAssignmentResponse;
import com.ordereasy.order_service.dto.OrderItemResponse;
import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.dto.PaginatedOrderResponse;
import com.ordereasy.order_service.dto.StockReleaseRequest;
import com.ordereasy.order_service.dto.StockReservationRequest;
import com.ordereasy.order_service.dto.StockReservationResponse;
import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderItem;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.event.OrderCancelledEvent;
import com.ordereasy.order_service.event.OrderCreatedEvent;
import com.ordereasy.order_service.event.OrderItemEvent;
import com.ordereasy.order_service.event.OrderStatusUpdatedEvent;
import com.ordereasy.order_service.exception.OrderNotFoundException;
import com.ordereasy.order_service.feign.DeliveryFeignClient;
import com.ordereasy.order_service.feign.InventoryFeignClient;
import com.ordereasy.order_service.kafka.OrderKafkaProducer;
import com.ordereasy.order_service.repository.OrderRepository;
import feign.FeignException;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderKafkaProducer kafkaProducer;
    private final InventoryFeignClient inventoryFeignClient;
    private final DeliveryFeignClient deliveryFeignClient;

    public OrderService(OrderRepository orderRepository,
                        OrderKafkaProducer kafkaProducer,
                        InventoryFeignClient inventoryFeignClient,
                        DeliveryFeignClient deliveryFeignClient) {
        this.orderRepository = orderRepository;
        this.kafkaProducer = kafkaProducer;
        this.inventoryFeignClient = inventoryFeignClient;
        this.deliveryFeignClient = deliveryFeignClient;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {

        // ── Step 1: Build bulk stock reservation request ────────────────────
        List<StockReservationRequest.StockItem> stockItems = request.getItems()
                .stream()
                .map(item -> StockReservationRequest.StockItem.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        StockReservationRequest stockRequest = StockReservationRequest.builder()
                .items(stockItems)
                .build();

        // ── Step 2: Reserve stock synchronously via Feign ───────────────────
        StockReservationResponse stockResponse = inventoryFeignClient.reserveStockBulk(stockRequest);

        // ── Step 3: Reject immediately if stock unavailable ─────────────────
        if (stockResponse == null || !stockResponse.isSuccess()) {
            throw new RuntimeException(
                    stockResponse != null ? stockResponse.getMessage() : "Stock reservation failed"
            );
        }

        // ── Step 4: Save order as CREATED (inside transaction) ──────────────
        //    We need a real orderId before calling Delivery Service.
        //    If delivery fails, @Transactional rolls back this save automatically.
        List<OrderItem> items = request.getItems().stream()
                .map(itemReq -> OrderItem.builder()
                        .productId(itemReq.getProductId())
                        .quantity(itemReq.getQuantity())
                        .price(itemReq.getPrice())
                        .build())
                .collect(Collectors.toList());

        double totalAmount = items.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        Order order = Order.builder()
                .userId(request.getUserId())
                .userEmail(request.getUserEmail())
                .totalAmount(totalAmount)
                .status(OrderStatus.CREATED)    // temporary — updated to CONFIRMED below
                .deliverySlot(request.getDeliverySlot())
                .createdAt(LocalDateTime.now())
                .items(items)
                .build();

        items.forEach(item -> item.setOrder(order));
        Order savedOrder = orderRepository.save(order);

        // ── Step 5: Assign delivery partner synchronously via Feign ─────────
        DeliveryAssignmentRequest deliveryRequest = DeliveryAssignmentRequest.builder()
                .orderId(savedOrder.getId())
                .userId(request.getUserId())
                .build();

        DeliveryAssignmentResponse deliveryResponse;
        try {
            deliveryResponse = deliveryFeignClient.assignDelivery(deliveryRequest);
        } catch (FeignException e) {
            // Delivery Service is down — release stock (best-effort), then re-throw
            // @Transactional rolls back the order save automatically
            releaseReservedStock(request);
            throw e;    // rethrown so GlobalExceptionHandler returns 503
        }

        // ── Step 6: If no partner available, release stock and reject ────────
        if (deliveryResponse == null || !deliveryResponse.isSuccess()) {
            releaseReservedStock(request);
            throw new RuntimeException(
                    deliveryResponse != null
                            ? deliveryResponse.getMessage()
                            : "Delivery assignment failed"
            );
        }

        // ── Step 7: Both stock and partner confirmed — mark order CONFIRMED ──
        savedOrder.setStatus(OrderStatus.CONFIRMED);
        Order confirmedOrder = orderRepository.save(savedOrder);

        // ── Step 8: Publish order-created event (Notification/Tracking async) ─
        List<OrderItemEvent> itemEvents = confirmedOrder.getItems().stream()
                .map(item -> {
                    OrderItemEvent e = new OrderItemEvent();
                    e.setProductId(item.getProductId());
                    e.setQuantity(item.getQuantity());
                    return e;
                })
                .collect(Collectors.toList());

        OrderCreatedEvent event = new OrderCreatedEvent();
        event.setOrderId(confirmedOrder.getId());
        event.setUserId(confirmedOrder.getUserId());
        event.setUserEmail(request.getUserEmail());
        event.setTotalAmount(confirmedOrder.getTotalAmount());
        event.setItems(itemEvents);
        event.setDeliverySlot(confirmedOrder.getDeliverySlot());

        kafkaProducer.sendOrderCreatedEvent(event);

        return mapToResponse(confirmedOrder);
    }

    /**
     * Best-effort stock release — called when delivery assignment fails after
     * stock was already reserved. Loops through each item and calls the
     * existing single-item /stock/release endpoint on Inventory Service.
     * Errors are swallowed (logged) since the primary failure is already handled.
     */
    private void releaseReservedStock(CreateOrderRequest request) {
        try {
            request.getItems().forEach(item -> {
                StockReleaseRequest releaseRequest = StockReleaseRequest.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build();
                inventoryFeignClient.releaseStock(releaseRequest);
            });
        } catch (Exception e) {
            System.err.println("Warning: Failed to release stock after delivery failure — " +
                    "manual correction may be needed: " + e.getMessage());
        }
    }

    @Transactional
    public OrderResponse cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        String oldStatus = order.getStatus().name();
        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        List<OrderItemEvent> itemEvents = savedOrder.getItems().stream()
                .map(item -> {
                    OrderItemEvent e = new OrderItemEvent();
                    e.setProductId(item.getProductId());
                    e.setQuantity(item.getQuantity());
                    return e;
                })
                .collect(Collectors.toList());

        OrderCancelledEvent cancelEvent = new OrderCancelledEvent();
        cancelEvent.setOrderId(savedOrder.getId());
        cancelEvent.setUserId(savedOrder.getUserId());
        cancelEvent.setUserEmail(savedOrder.getUserEmail());
        cancelEvent.setItems(itemEvents);
        kafkaProducer.sendOrderCancelledEvent(cancelEvent);

        return mapToResponse(savedOrder);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        String oldStatus = order.getStatus().name();
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);

        OrderStatusUpdatedEvent event = new OrderStatusUpdatedEvent();
        event.setOrderId(savedOrder.getId());
        event.setUserId(savedOrder.getUserId());
        event.setUserEmail(savedOrder.getUserEmail());
        event.setOldStatus(oldStatus);
        event.setNewStatus(savedOrder.getStatus().name());
        kafkaProducer.sendOrderStatusUpdatedEvent(event);

        return mapToResponse(savedOrder);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
        return mapToResponse(order);
    }

    public PaginatedOrderResponse getOrders(
            int page, int size, String sortBy, String direction,
            OrderStatus status, Long userId,
            Double minAmount, Double maxAmount,
            LocalDateTime startDate, LocalDateTime endDate) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Order> orderPage;

        if (minAmount != null && maxAmount != null) {
            orderPage = orderRepository.findByTotalAmountBetween(minAmount, maxAmount, pageable);
        } else if (startDate != null && endDate != null) {
            orderPage = orderRepository.findByCreatedAtBetween(startDate, endDate, pageable);
        } else if (status != null && userId != null) {
            orderPage = orderRepository.findByStatusAndUserId(status, userId, pageable);
        } else if (status != null) {
            orderPage = orderRepository.findByStatus(status, pageable);
        } else if (userId != null) {
            orderPage = orderRepository.findByUserId(userId, pageable);
        } else {
            orderPage = orderRepository.findAll(pageable);
        }

        return new PaginatedOrderResponse(
                orderPage.getContent().stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList()),
                orderPage.getNumber(),
                orderPage.getTotalPages(),
                orderPage.getTotalElements()
        );
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems() == null
                ? List.of()
                : order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getId())
                .userId(order.getUserId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .deliverySlot(order.getDeliverySlot())
                .build();
    }
}