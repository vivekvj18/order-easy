package com.ordereasy.order_service.repository;

import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;


public interface OrderRepository extends JpaRepository<Order,Long> {

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Page<Order> findByStatusAndUserId(OrderStatus status, Long userId, Pageable pageable);
}
