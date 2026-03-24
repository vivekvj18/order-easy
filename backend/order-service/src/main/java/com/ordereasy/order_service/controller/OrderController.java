package com.ordereasy.order_service.controller;

import org.springframework.web.bind.annotation.RestController;
import com.ordereasy.order_service.dto.CreateOrderRequest;
import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService)
    {
        this.orderService=orderService;
    }

    @PostMapping
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request)
    {
        // Convert DTO → Entity
        Order order = Order.builder()
                .userId(request.getUserId())
                .totalAmount(request.getTotalAmount())
                .build();

        // save this entity into object
        Order savedOrder = orderService.createOrder(order);

        // Convert Entity → Response DTO
        return OrderResponse.builder()
                .orderId(savedOrder.getId())
                .status(savedOrder.getStatus().name())
                .build();
    }

    @GetMapping
    public List<OrderResponse> getAllOrders() {

        return orderService.getAllOrders()
                .stream()
                .map(order -> OrderResponse.builder()
                        .orderId(order.getId())
                        .status(order.getStatus().name())
                        .build()
                )
                .toList();
    }

    @GetMapping("/{id}")
    public OrderResponse getOrderById(@PathVariable Long id) {

        Order order = orderService.getOrderById(id);

        if (order == null) {
            return null; // temporary (we’ll improve later)
        }

        return OrderResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus().name())
                .build();
    }
}
