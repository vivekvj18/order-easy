package com.ordereasy.inventory_service.event;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderCancelledEvent {
    private Long orderId;
    private Long productId;
    private Integer quantity;
}