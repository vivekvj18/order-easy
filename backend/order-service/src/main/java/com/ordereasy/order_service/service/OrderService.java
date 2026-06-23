package com.ordereasy.order_service.service;

import com.ordereasy.order_service.dto.CreateOrderRequest;
import com.ordereasy.order_service.dto.OrderItemResponse;
import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.dto.PaginatedOrderResponse;
import com.ordereasy.order_service.dto.StockReleaseRequest;
import com.ordereasy.order_service.dto.StockReservationRequest;
import com.ordereasy.order_service.dto.StockReservationResponse;
import com.ordereasy.order_service.dto.OrderAnalyticsSummaryResponse;
import com.ordereasy.order_service.dto.OrderStatusBreakdownResponse;
import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderItem;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.event.OrderCancelledEvent;
import com.ordereasy.order_service.event.OrderCreatedEvent;
import com.ordereasy.order_service.event.OrderItemEvent;
import com.ordereasy.order_service.event.OrderStatusUpdatedEvent;
import com.ordereasy.order_service.exception.AccessDeniedException;
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
    private final ExternalServiceProxy externalServiceProxy;

    public OrderService(OrderRepository orderRepository,
                        OrderKafkaProducer kafkaProducer,
                        ExternalServiceProxy externalServiceProxy) {
        this.orderRepository = orderRepository;
        this.kafkaProducer = kafkaProducer;
        this.externalServiceProxy = externalServiceProxy;
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
            // Fallback: Fetch from Cart Service (Protected by Circuit Breaker)
            CartResponse cart = externalServiceProxy.getCart(request.getUserId());
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
        // Include user delivery coordinates for dark store selection (Phase 0).
        List<StockReservationRequest.StockItem> stockItems = items.stream()
                .map(item -> StockReservationRequest.StockItem.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        StockReservationRequest stockRequest = StockReservationRequest.builder()
                .userLatitude(request.getDeliveryLatitude())
                .userLongitude(request.getDeliveryLongitude())
                .items(stockItems)
                .build();

        // ── Step 2: Reserve stock + dark store selection (Protected by Circuit Breaker) ──
        // Inventory Service performs:
        //   Phase 0: Select nearest fulfillable dark store.
        //   Phase 1: Validate all items in selected store.
        //   Phase 2: Increment reservedQuantity in selected store.
        // Returns darkStoreId + darkStoreName + coords on success.
        StockReservationResponse stockResponse = externalServiceProxy.reserveStockBulk(stockRequest);

        // ── Step 3: Reject immediately if stock unavailable or no dark store found ──
        if (stockResponse == null || !stockResponse.isSuccess()) {
            throw new RuntimeException(
                    stockResponse != null ? stockResponse.getMessage() : "Stock reservation failed"
            );
        }

        // ── Step 4: Build and save order as PENDING_PAYMENT ───────────────────
        // Persist the selected dark store details so the order knows its fulfillment source.
        Order order = Order.builder()
                .userId(request.getUserId())
                .userEmail(request.getUserEmail())
                .totalAmount(totalAmount)
                .status(OrderStatus.PENDING_PAYMENT)
                .deliverySlot(request.getDeliverySlot())
                .deliveryAddress(request.getDeliveryAddress())
                .deliveryLatitude(request.getDeliveryLatitude())
                .deliveryLongitude(request.getDeliveryLongitude())
                .darkStoreId(stockResponse.getDarkStoreId())
                .darkStoreName(stockResponse.getDarkStoreName())
                .darkStoreLatitude(stockResponse.getDarkStoreLatitude())
                .darkStoreLongitude(stockResponse.getDarkStoreLongitude())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .items(items)
                .build();

        items.forEach(item -> item.setOrder(order));
        Order savedOrder = orderRepository.save(order);

        // ── Step 5: Publish order-created event with dark store details ───────
        // Dark store details are propagated so Payment Service can include them
        // in payment-completed, allowing Inventory Service to finalize at
        // (darkStoreId + productId) level without querying the Order DB.
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
        event.setDeliveryLatitude(request.getDeliveryLatitude());
        event.setDeliveryLongitude(request.getDeliveryLongitude());
        event.setDarkStoreId(savedOrder.getDarkStoreId());
        event.setDarkStoreName(savedOrder.getDarkStoreName());
        event.setDarkStoreLatitude(savedOrder.getDarkStoreLatitude());
        event.setDarkStoreLongitude(savedOrder.getDarkStoreLongitude());

        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        try {
                            kafkaProducer.sendOrderCreatedEvent(event);
                        } catch (Exception e) {
                            System.err.println("Kafka event failed: " + e.getMessage());
                        }
                    }
                }
            );
        } else {
            try {
                kafkaProducer.sendOrderCreatedEvent(event);
            } catch (Exception e) {
                System.err.println("Kafka event failed: " + e.getMessage());
            }
        }

        // ── Step 6: Clear Cart (Best effort) ────────────────────────────────
        try {
            externalServiceProxy.clearCart(request.getUserId());
        } catch (Exception e) {
            System.err.println("Warning: Failed to clear cart after order placement: " + e.getMessage());
        }

        return mapToResponse(savedOrder);
    }

    /**
     * Best-effort stock release — called when delivery assignment fails after
     * stock was already reserved. Errors are swallowed since the primary failure
     * is already handled.
     */
    private void releaseReservedStock(CreateOrderRequest request) {
        try {
            request.getItems().forEach(item -> {
                StockReleaseRequest releaseRequest = StockReleaseRequest.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build();
                externalServiceProxy.releaseStock(releaseRequest);
            });
        } catch (Exception e) {
            System.err.println("Warning: Failed to release stock after delivery failure — " +
                    "manual correction may be needed: " + e.getMessage());
        }
    }

    @Transactional
    public OrderResponse cancelOrder(Long id, Long callerUserId, String callerRole) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        // Object-level authorization: CUSTOMER can cancel only own orders
        if ("CUSTOMER".equals(callerRole) && !order.getUserId().equals(callerUserId)) {
            throw new AccessDeniedException("Access denied: You can only cancel your own orders");
        }

        String oldStatus = order.getStatus().name();
        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
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
        cancelEvent.setDarkStoreId(savedOrder.getDarkStoreId()); // needed for stock release
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
        order.setUpdatedAt(LocalDateTime.now());
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

    public OrderResponse getOrderById(Long id, Long callerUserId, String callerRole) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        // Object-level authorization: CUSTOMER can view only own orders
        if ("CUSTOMER".equals(callerRole) && !order.getUserId().equals(callerUserId)) {
            throw new AccessDeniedException("Access denied: You can only view your own orders");
        }

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
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryLatitude(order.getDeliveryLatitude())
                .deliveryLongitude(order.getDeliveryLongitude())
                .darkStoreId(order.getDarkStoreId())
                .darkStoreName(order.getDarkStoreName())
                .darkStoreLatitude(order.getDarkStoreLatitude())
                .darkStoreLongitude(order.getDarkStoreLongitude())
                .build();
    }

    public OrderAnalyticsSummaryResponse getAnalyticsSummary() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long totalOrders = orderRepository.count();
        long confirmed = orderRepository.countByStatus(OrderStatus.PAYMENT_CONFIRMED);
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelled = orderRepository.countByStatus(OrderStatus.CANCELLED);
        Double totalRevenue = orderRepository.sumTotalRevenue();
        long todayOrders = orderRepository.countTodayOrders(startOfDay);
        Double todayRevenue = orderRepository.sumTodayRevenue(startOfDay);

        return OrderAnalyticsSummaryResponse.builder()
                .totalOrders(totalOrders)
                .confirmedOrders(confirmed)
                .deliveredOrders(delivered)
                .cancelledOrders(cancelled)
                .totalRevenue(totalRevenue != null ? totalRevenue : 0.0)
                .todayOrders(todayOrders)
                .todayRevenue(todayRevenue != null ? todayRevenue : 0.0)
                .build();
    }

    public List<OrderStatusBreakdownResponse> getAnalyticsStatusBreakdown() {
        long confirmed = orderRepository.countByStatus(OrderStatus.PAYMENT_CONFIRMED);
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelled = orderRepository.countByStatus(OrderStatus.CANCELLED);

        return List.of(
                new OrderStatusBreakdownResponse("PAYMENT_CONFIRMED", confirmed),
                new OrderStatusBreakdownResponse("DELIVERED", delivered),
                new OrderStatusBreakdownResponse("CANCELLED", cancelled)
        );
    }
}
