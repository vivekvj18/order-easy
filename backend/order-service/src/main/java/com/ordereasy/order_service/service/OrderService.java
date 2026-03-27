package com.ordereasy.order_service.service;

import com.ordereasy.order_service.dto.OrderResponse;
import com.ordereasy.order_service.dto.PaginatedOrderResponse;
import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.exception.OrderNotFoundException;
import com.ordereasy.order_service.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order createOrder(Order order) {
        order.setStatus(OrderStatus.CREATED);
        order.setCreatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id)); // ✅ throws instead of returning null
    }

    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id)); // ✅ consistent
        order.setStatus(status);
        return orderRepository.save(order);
    }

    public PaginatedOrderResponse getOrders(

            int page,              // 🔹 page number (0-based index)
            int size,              // 🔹 number of records per page

            String sortBy,         // 🔹 field name to sort (e.g., createdAt, totalAmount)
            String direction,      // 🔹 sorting direction (asc / desc)

            OrderStatus status,    // 🔹 filter: order status (optional)
            Long userId,           // 🔹 filter: userId (optional)

            Double minAmount,      // 🔹 filter: minimum amount (optional)
            Double maxAmount,      // 🔹 filter: maximum amount (optional)

            LocalDateTime startDate, // 🔹 filter: start date (optional)
            LocalDateTime endDate    // 🔹 filter: end date (optional)
    ) {

        // 🔥 Step 1: Create Sort object dynamically
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()     // if asc → ascending order
                : Sort.by(sortBy).descending();   // else → descending order

        // 🔥 Step 2: Create Pageable (pagination + sorting combined)
        Pageable pageable = PageRequest.of(page, size, sort);

        // 🔥 Step 3: Decide which query to execute based on filters
        Page<Order> orderPage;

        // 🔹 Priority 1: Amount range filter (highest priority)
        if (minAmount != null && maxAmount != null) {
            orderPage = orderRepository.findByTotalAmountBetween(
                    minAmount, maxAmount, pageable
            );

            // 🔹 Priority 2: Date range filter
        } else if (startDate != null && endDate != null) {
            orderPage = orderRepository.findByCreatedAtBetween(
                    startDate, endDate, pageable
            );

            // 🔹 Priority 3: Combined filter (status + userId)
        } else if (status != null && userId != null) {
            orderPage = orderRepository.findByStatusAndUserId(
                    status, userId, pageable
            );

            // 🔹 Only status filter
        } else if (status != null) {
            orderPage = orderRepository.findByStatus(
                    status, pageable
            );

            // 🔹 Only userId filter
        } else if (userId != null) {
            orderPage = orderRepository.findByUserId(
                    userId, pageable
            );

            // 🔹 No filters → fetch all orders
        } else {
            orderPage = orderRepository.findAll(pageable);
        }

        // 🔥 Step 4: Convert Entity → DTO using map()
        Page<OrderResponse> responsePage = orderPage.map(order ->
                new OrderResponse(
                        order.getId(),      // map id → orderId
                        order.getStatus()   // map status
                )
        );

        // 🔥 Step 5: Build clean custom response
        return new PaginatedOrderResponse(
                responsePage.getContent(),        // list of orders
                responsePage.getNumber(),         // current page
                responsePage.getTotalPages(),     // total pages
                responsePage.getTotalElements()   // total records
        );
    }
}