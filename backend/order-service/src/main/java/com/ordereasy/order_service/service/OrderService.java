package com.ordereasy.order_service.service;

import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository)
    {
        this.orderRepository=orderRepository;
    }

    public Order createOrder(Order order)
    {
        order.setStatus(OrderStatus.CREATED);

        order.setCreatedAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    public List<Order> getAllOrders(){
        return orderRepository.findAll();
    }

    public Order getOrderById(Long id)
    {
        return orderRepository.findById(id).orElse(null);
    }
}
