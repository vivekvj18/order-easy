package com.ordereasy.order_service.controller;

import com.ordereasy.order_service.dto.CreateOrderRequest;
import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.dto.PaginatedOrderResponse;
import com.ordereasy.order_service.dto.OrderAnalyticsSummaryResponse;
import com.ordereasy.order_service.dto.OrderStatusBreakdownResponse;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.exception.AccessDeniedException;
import com.ordereasy.order_service.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
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

    // ── Helper: parse X-User-Id header to Long ────────────────────────────────

    private Long parseUserId(String header) {
        if (header == null || header.isBlank()) return null;
        try { return Long.parseLong(header.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    // ── Create Order ──────────────────────────────────────────────────────────
    // Override body userId with verified X-User-Id from Gateway to prevent spoofing.

    @PostMapping
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request,
                                     HttpServletRequest httpRequest) {
        Long callerUserId = parseUserId(httpRequest.getHeader("X-User-Id"));
        if (callerUserId != null) {
            request.setUserId(callerUserId);
        }
        log.info("Received request to create order for userId: {}", request.getUserId());
        OrderResponse response = orderService.createOrder(request);
        log.info("Order created successfully with orderId: {}", response.getOrderId());
        return response;
    }

    // ── Get All Orders (ADMIN only) ───────────────────────────────────────────

    @GetMapping("/all")
    public List<OrderResponse> getAllOrders(HttpServletRequest request) {
        String callerRole = request.getHeader("X-User-Role");
        if (!"ADMIN".equals(callerRole)) {
            throw new AccessDeniedException("Access denied: Admin only");
        }
        log.info("Received request to fetch all orders");
        List<OrderResponse> orders = orderService.getAllOrders();
        log.info("Returning {} orders", orders.size());
        return orders;
    }

    // ── Get Order By ID ───────────────────────────────────────────────────────
    // CUSTOMER: only own order. ADMIN: any order.

    @GetMapping("/{id}")
    public OrderResponse getOrderById(@PathVariable Long id, HttpServletRequest request) {
        Long   callerUserId = parseUserId(request.getHeader("X-User-Id"));
        String callerRole   = request.getHeader("X-User-Role");
        log.info("Received request to fetch order with id: {}", id);
        OrderResponse response = orderService.getOrderById(id, callerUserId, callerRole);
        log.info("Returning order: {} with status: {}", id, response.getStatus());
        return response;
    }

    // ── Update Order Status ───────────────────────────────────────────────────
    // Gateway already restricts to DELIVERY_PARTNER/ADMIN — no ownership check needed here.

    @PutMapping("/{id}/status")
    public OrderResponse updateOrderStatus(@PathVariable Long id,
                                           @RequestParam OrderStatus status) {
        log.info("Received request to update order: {} to status: {}", id, status);
        OrderResponse response = orderService.updateOrderStatus(id, status);
        log.info("Order: {} status updated successfully to: {}", id, status);
        return response;
    }

    // ── Cancel Order ──────────────────────────────────────────────────────────
    // CUSTOMER: can cancel only own order. ADMIN: can cancel any.

    @PutMapping("/{id}/cancel")
    public OrderResponse cancelOrder(@PathVariable Long id, HttpServletRequest request) {
        Long   callerUserId = parseUserId(request.getHeader("X-User-Id"));
        String callerRole   = request.getHeader("X-User-Role");
        log.warn("Received request to cancel order: {}", id);
        OrderResponse response = orderService.cancelOrder(id, callerUserId, callerRole);
        log.warn("Order: {} has been cancelled", id);
        return response;
    }

    // ── Get Orders (Paginated) ────────────────────────────────────────────────
    // CUSTOMER: userId query param ignored — always scoped to caller's own account.
    // ADMIN: userId query param respected for filtering.

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
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) {

        Long   callerUserId = parseUserId(request.getHeader("X-User-Id"));
        String callerRole   = request.getHeader("X-User-Role");

        // CUSTOMER cannot access other users' orders — force their own userId
        if ("CUSTOMER".equals(callerRole)) {
            userId = callerUserId;
        }

        log.info("Fetching orders — page: {}, size: {}, status: {}, userId: {}",
                 page, size, status, userId);

        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
        LocalDateTime end   = endDate   != null ? LocalDateTime.parse(endDate)   : null;

        PaginatedOrderResponse response = orderService.getOrders(
                page, size, sortBy, direction,
                status, userId,
                minAmount, maxAmount,
                start, end);

        log.info("Returning page {}/{} with {} orders",
                 response.getCurrentPage(), response.getTotalPages(), response.getOrders().size());
        return response;
    }

    // ── Analytics (ADMIN only) ────────────────────────────────────────────────

    @GetMapping("/analytics/summary")
    public OrderAnalyticsSummaryResponse getAnalyticsSummary(HttpServletRequest request) {
        String callerRole = request.getHeader("X-User-Role");
        if (!"ADMIN".equals(callerRole)) {
            throw new AccessDeniedException("Access denied: Admin only");
        }
        log.info("Received request for order analytics summary");
        return orderService.getAnalyticsSummary();
    }

    @GetMapping("/analytics/status-breakdown")
    public List<OrderStatusBreakdownResponse> getAnalyticsStatusBreakdown(HttpServletRequest request) {
        String callerRole = request.getHeader("X-User-Role");
        if (!"ADMIN".equals(callerRole)) {
            throw new AccessDeniedException("Access denied: Admin only");
        }
        log.info("Received request for order analytics status breakdown");
        return orderService.getAnalyticsStatusBreakdown();
    }
}