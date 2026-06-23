package com.ordereasy.order_service.event;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Published to "order-cancelled" Kafka topic.
 * Consumed by Inventory Service to release reserved stock in the selected dark store.
 *
 * darkStoreId is required so Inventory Service knows which dark store's stock
 * to release — stock is now at (darkStoreId + productId) level.
 */
@Getter
@Setter
public class OrderCancelledEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Long darkStoreId; // required: which dark store had the reservation
    private List<OrderItemEvent> items;
}