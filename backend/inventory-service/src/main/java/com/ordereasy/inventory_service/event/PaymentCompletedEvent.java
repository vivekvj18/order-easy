package com.ordereasy.inventory_service.event;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Consumed from Kafka topic "payment-completed".
 * Published by Payment Service after a payment transaction is processed.
 * Inventory Service uses this to finalize reserved stock on SUCCESS.
 *
 * New field: darkStoreId — identifies the dark store where stock was reserved
 * during checkout. Finalization must happen at (darkStoreId + productId) level.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
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

    /**
     * The dark store from which this order was fulfilled.
     * Required for stock finalization at (darkStoreId + productId) level.
     */
    private Long darkStoreId;
}
