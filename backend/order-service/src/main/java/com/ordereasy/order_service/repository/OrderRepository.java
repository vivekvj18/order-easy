package com.ordereasy.order_service.repository;

import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order,Long> {

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Page<Order> findByStatusAndUserId(OrderStatus status, Long userId, Pageable pageable);

    Page<Order> findByTotalAmountBetween(Double minAmount, Double maxAmount, Pageable pageable);

    Page<Order> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    long countByStatus(OrderStatus status);

    /**
     * Finds orders in a given status whose createdAt is older than the provided cutoff.
     * Used by the ReservationExpiryScheduler to find stale PENDING_PAYMENT orders.
     */
    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime cutoff);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o WHERE o.status <> 'CANCELLED'")
    Double sumTotalRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startDate")
    long countTodayOrders(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o WHERE o.createdAt >= :startDate AND o.status <> 'CANCELLED'")
    Double sumTodayRevenue(@Param("startDate") LocalDateTime startDate);
}

