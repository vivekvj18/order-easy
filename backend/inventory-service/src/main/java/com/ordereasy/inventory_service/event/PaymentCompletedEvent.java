package com.ordereasy.inventory_service.event;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Consumed from Kafka topic "payment-completed".
 * Published by Payment Service after a payment transaction is processed.
 * Inventory Service uses this to finalize reserved stock on SUCCESS.
 */
@Getter
@Setter
public class PaymentCompletedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double amount;
    private String status;          // "SUCCESS" | "FAILED"
    private String transactionId;
    private List<OrderItemEvent> items; // productId + quantity for each ordered item
    private String deliverySlot;
    private Double deliveryLatitude;
    private Double deliveryLongitude;
}
