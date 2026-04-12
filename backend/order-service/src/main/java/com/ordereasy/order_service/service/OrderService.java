package com.ordereasy.order_service.service;

import com.ordereasy.order_service.dto.OrderItemResponse;
import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.dto.CreateOrderRequest;
import com.ordereasy.order_service.dto.PaginatedOrderResponse;
import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderItem;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.event.OrderCancelledEvent;
import com.ordereasy.order_service.event.OrderCreatedEvent;
import com.ordereasy.order_service.event.OrderItemEvent;
import com.ordereasy.order_service.event.OrderStatusUpdatedEvent;
import com.ordereasy.order_service.exception.OrderNotFoundException;
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

    public OrderService(OrderRepository orderRepository,
                        OrderKafkaProducer kafkaProducer) {
        this.orderRepository = orderRepository;
        this.kafkaProducer = kafkaProducer;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {

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
                .status(OrderStatus.CREATED)
                .deliverySlot(request.getDeliverySlot())
                .createdAt(LocalDateTime.now())
                .items(items)
                .build();

        items.forEach(item -> item.setOrder(order));

        Order savedOrder = orderRepository.save(order);

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

        kafkaProducer.sendOrderCreatedEvent(event);

        return mapToResponse(savedOrder);
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