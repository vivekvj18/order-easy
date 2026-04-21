package com.ordereasy.payment_service.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderCreatedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double totalAmount;
    private String deliverySlot;
    private List<OrderItemEvent> items;
}
