package com.ordereasy.inventory_service.event;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OrderCancelledEvent {
    private Long orderId;
    private List<OrderItemEvent> items;
}