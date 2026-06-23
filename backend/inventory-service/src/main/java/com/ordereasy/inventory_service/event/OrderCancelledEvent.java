package com.ordereasy.inventory_service.event;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Consumed from Kafka topic "order-cancelled".
 * Inventory Service uses this to release reserved stock back to the dark store.
 *
 * darkStoreId identifies which dark store's stock needs to be released.
 */
@Getter
@Setter
public class OrderCancelledEvent {
    private Long orderId;
    private Long darkStoreId; // required to release stock at correct dark store
    private List<OrderItemEvent> items;
}