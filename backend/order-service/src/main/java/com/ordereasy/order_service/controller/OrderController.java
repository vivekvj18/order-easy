package com.ordereasy.order_service.controller;

import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.dto.CreateOrderRequest;
import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.dto.PaginatedOrderResponse;
import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {


    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // ✅ CREATE ORDER
    @PostMapping
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {

        Order order = Order.builder()
                .userId(request.getUserId())
                .totalAmount(request.getTotalAmount())
                .build();

        Order savedOrder = orderService.createOrder(order);

        return OrderResponse.builder()
                .orderId(savedOrder.getId())
                .status(savedOrder.getStatus())
                .build();
    }

    // ✅ GET ALL ORDERS (NON-PAGINATED)
    @GetMapping("/all")
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders()
                .stream()
                .map(order -> OrderResponse.builder()
                        .orderId(order.getId())
                        .status(order.getStatus())
                        .build()
                )
                .toList();
    }

    // ✅ GET ORDER BY ID
    @GetMapping("/{id}")
    public OrderResponse getOrderById(@PathVariable Long id) {

        Order order = orderService.getOrderById(id);

        return OrderResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus())
                .build();
    }

    // ✅ UPDATE STATUS
    @PutMapping("/{id}/status")
    public OrderResponse updateOrderStatus(@PathVariable Long id,
                                           @RequestParam OrderStatus status) {

        Order updatedOrder = orderService.updateOrderStatus(id, status);

        return OrderResponse.builder()
                .orderId(updatedOrder.getId())
                .status(updatedOrder.getStatus()) // 🔥 FIXED
                .build();
    }

    // 🔥 PAGINATION API (MAIN ONE)
    @GetMapping
    public PaginatedOrderResponse getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return orderService.getOrders(page, size, sortBy, direction);
    }


}
