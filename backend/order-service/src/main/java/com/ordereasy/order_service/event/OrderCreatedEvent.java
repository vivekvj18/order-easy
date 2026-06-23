package com.ordereasy.order_service.event;

import com.ordereasy.order_service.enums.DeliverySlot;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Published by Order Service to "order-created" Kafka topic.
 * Consumed by Payment Service to initiate payment processing.
 *
 * Dark store fields are included so Payment Service can propagate them
 * to the payment-completed event, allowing Inventory Service to finalize
 * stock at the correct (darkStoreId + productId) level.
 */
@Getter
@Setter
public class OrderCreatedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double totalAmount;
    private List<OrderItemEvent> items;
    private DeliverySlot deliverySlot;
    private Double deliveryLatitude;   // customer's delivery location
    private Double deliveryLongitude;

    /** Selected dark store for this order. Required for stock finalization. */
    private Long darkStoreId;
    private String darkStoreName;
    private Double darkStoreLatitude;
    private Double darkStoreLongitude;
}