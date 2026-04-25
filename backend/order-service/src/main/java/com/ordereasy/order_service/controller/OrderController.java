package com.ordereasy.order_service.controller;

import com.ordereasy.order_service.dto.CreateOrderRequest;
import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.dto.PaginatedOrderResponse;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Received request to create order for userId: {}", request.getUserId());
        OrderResponse response = orderService.createOrder(request);
        log.info("Order created successfully with orderId: {}", response.getOrderId());
        return response;
    }

    @GetMapping("/all")
    public List<OrderResponse> getAllOrders() {
        log.info("Received request to fetch all orders");
        List<OrderResponse> orders = orderService.getAllOrders();
        log.info("Returning {} orders", orders.size());
        return orders;
    }

    @GetMapping("/{id}")
    public OrderResponse getOrderById(@PathVariable Long id) {
        log.info("Received request to fetch order with id: {}", id);
        OrderResponse response = orderService.getOrderById(id);
        log.info("Returning order: {} with status: {}", id, response.getStatus());
        return response;
    }

    @PutMapping("/{id}/status")
    public OrderResponse updateOrderStatus(@PathVariable Long id,
                                           @RequestParam OrderStatus status) {
        log.info("Received request to update order: {} to status: {}", id, status);
        OrderResponse response = orderService.updateOrderStatus(id, status);
        log.info("Order: {} status updated successfully to: {}", id, status);
        return response;
    }

    @PutMapping("/{id}/cancel")
    public OrderResponse cancelOrder(@PathVariable Long id) {
        log.warn("Received request to cancel order: {}", id);
        OrderResponse response = orderService.cancelOrder(id);
        log.warn("Order: {} has been cancelled", id);
        return response;
    }

    @GetMapping
    public PaginatedOrderResponse getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        log.info("Fetching orders — page: {}, size: {}, status: {}, userId: {}", 
                 page, size, status, userId);

        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;

        PaginatedOrderResponse response = orderService.getOrders(
                page, size, sortBy, direction,
                status, userId,
                minAmount, maxAmount,
                start, end);

        log.info("Returning page {}/{} with {} orders",
                 response.getCurrentPage(), response.getTotalPages(), response.getOrders().size());
        return response;
    }
}