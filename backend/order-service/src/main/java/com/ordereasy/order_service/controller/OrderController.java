package com.ordereasy.order_service.controller;

import com.ordereasy.order_service.entity.OrderStatus;
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

        return OrderResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus().name())
                .build();
    }
    @PutMapping("/{id}/status")
    public OrderResponse updateOrderStatus(@PathVariable Long id,
                                           @RequestParam OrderStatus status)
    {
        Order updatedOrder = orderService.updateOrderStatus(id,status);
        return OrderResponse.builder()
                .orderId(updatedOrder.getId())
                .status(updatedOrder.getStatus().name())
                .build();
    }

}
