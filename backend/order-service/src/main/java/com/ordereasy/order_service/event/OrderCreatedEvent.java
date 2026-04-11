package com.ordereasy.order_service.event;

import com.ordereasy.order_service.enums.DeliverySlot;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OrderCreatedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double totalAmount;
    private List<OrderItemEvent> items;
    private DeliverySlot deliverySlot;
}