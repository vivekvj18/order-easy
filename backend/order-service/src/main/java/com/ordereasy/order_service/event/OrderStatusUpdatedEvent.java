package com.ordereasy.order_service.event;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderStatusUpdatedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private String oldStatus;
    private String newStatus;
}