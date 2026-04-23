package com.ordereasy.order_service.service;

import com.ordereasy.order_service.dto.CreateOrderRequest;
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
import com.ordereasy.order_service.feign.InventoryFeignClient;
import com.ordereasy.order_service.feign.CartFeignClient;
import com.ordereasy.order_service.dto.CartResponse;
import com.ordereasy.order_service.kafka.OrderKafkaProducer;
import com.ordereasy.order_service.repository.OrderRepository;
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
    private final CartFeignClient cartFeignClient;

    public OrderService(OrderRepository orderRepository,
                        OrderKafkaProducer kafkaProducer,
                        InventoryFeignClient inventoryFeignClient,
                        CartFeignClient cartFeignClient) {
        this.orderRepository = orderRepository;
        this.kafkaProducer = kafkaProducer;
        this.inventoryFeignClient = inventoryFeignClient;
        this.cartFeignClient = cartFeignClient;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {

        List<OrderItem> items;
        Double totalAmount;

        // ── Step 0: Resolve Items & Total (Request vs Cart Service) ─────────
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            // Priority: Use items provided in the request (Frontend-driven cart)
            items = request.getItems().stream()
                    .map(item -> OrderItem.builder()
                            .productId(item.getProductId())
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .build())
                    .collect(Collectors.toList());
            totalAmount = request.getTotalAmount();
        } else {
            // Fallback: Fetch from Cart Service (Backend-driven cart)
            CartResponse cart = cartFeignClient.getCart(request.getUserId());
            if (cart == null || cart.getItems().isEmpty()) {
                throw new RuntimeException("Cart is empty");
            }
            items = cart.getItems().stream()
                    .map(item -> OrderItem.builder()
                            .productId(item.getProductId())
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .build())
                    .collect(Collectors.toList());
            totalAmount = cart.getTotalAmount();
        }

        // ── Step 1: Build bulk stock reservation request ────────────────────
        List<StockReservationRequest.StockItem> stockItems = items.stream()
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

        // ── Step 4: Build and save order as CONFIRMED ───────────────────────
        Order order = Order.builder()
                .userId(request.getUserId())
                .userEmail(request.getUserEmail())
                .totalAmount(totalAmount)
                .status(OrderStatus.CONFIRMED)
                .deliverySlot(request.getDeliverySlot())
                .createdAt(LocalDateTime.now())
                .items(items)
                .build();

        items.forEach(item -> item.setOrder(order));
        Order savedOrder = orderRepository.save(order);

        // ── Step 5: Publish order-created event ──────────────────────────────
        List<OrderItemEvent> itemEvents = savedOrder.getItems().stream()
                .map(item -> {
                    OrderItemEvent e = new OrderItemEvent();
                    e.setProductId(item.getProductId());
                    e.setQuantity(item.getQuantity());
                    return e;
                })
                .collect(Collectors.toList());

        OrderCreatedEvent event = new OrderCreatedEvent();
        event.setOrderId(savedOrder.getId());
        event.setUserId(savedOrder.getUserId());
        event.setUserEmail(request.getUserEmail());
        event.setTotalAmount(savedOrder.getTotalAmount());
        event.setItems(itemEvents);
        event.setDeliverySlot(savedOrder.getDeliverySlot());

        try {
            kafkaProducer.sendOrderCreatedEvent(event);
        } catch (Exception e) {
            System.err.println("Kafka event failed: " + e.getMessage());
        }

        // ── Step 6: Clear Cart (Best effort) ────────────────────────────────
        try {
            cartFeignClient.clearCart(request.getUserId());
        } catch (Exception e) {
            System.err.println("Warning: Failed to clear cart after order placement: " + e.getMessage());
        }

        return mapToResponse(savedOrder);
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