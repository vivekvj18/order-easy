package com.ordereasy.order_service.controller;

import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.dto.CreateOrderRequest;
import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.dto.PaginatedOrderResponse;
import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
                .productId(request.getProductId())
                .quantity(request.getQuantity())
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

    @PutMapping("/{id}/cancel")
    public OrderResponse cancelOrder(@PathVariable Long id) {
        Order cancelledOrder = orderService.cancelOrder(id);
        return OrderResponse.builder()
                .orderId(cancelledOrder.getId())
                .status(cancelledOrder.getStatus())
                .build();
    }

    // 🔥 PAGINATION API (MAIN ONE)
    @GetMapping
    public PaginatedOrderResponse getOrders(

            // 🔹 Pagination params (default values if not provided)
            @RequestParam(defaultValue = "0") int page,      // page number (0-based)
            @RequestParam(defaultValue = "5") int size,      // number of records per page

            // 🔹 Sorting params
            @RequestParam(defaultValue = "createdAt") String sortBy,   // field to sort
            @RequestParam(defaultValue = "desc") String direction,     // asc / desc

            // 🔹 Basic filtering (optional)
            @RequestParam(required = false) OrderStatus status,  // filter by order status
            @RequestParam(required = false) Long userId,         // filter by userId

            // 🔹 Range filtering (optional)
            @RequestParam(required = false) Double minAmount,    // minimum amount
            @RequestParam(required = false) Double maxAmount,    // maximum amount

            // 🔹 Date filtering (received as String from URL)
            @RequestParam(required = false) String startDate,    // start date (String)
            @RequestParam(required = false) String endDate       // end date (String)
    ) {

        // 🔥 Convert startDate String → LocalDateTime (if present)
        LocalDateTime start = (startDate != null)
                ? LocalDateTime.parse(startDate)   // parse string to date-time
                : null;                            // if not provided → null

        // 🔥 Convert endDate String → LocalDateTime (if present)
        LocalDateTime end = (endDate != null)
                ? LocalDateTime.parse(endDate)
                : null;

        // 🚀 Call service layer with all parameters
        return orderService.getOrders(
                page,        // pagination: page number
                size,        // pagination: page size
                sortBy,      // sorting field
                direction,   // sorting direction
                status,      // filter: status
                userId,      // filter: userId
                minAmount,   // filter: min amount
                maxAmount,   // filter: max amount
                start,       // filter: start date
                end          // filter: end date
        );
    }

}
