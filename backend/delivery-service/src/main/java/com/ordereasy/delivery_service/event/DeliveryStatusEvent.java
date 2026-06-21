package com.ordereasy.delivery_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Published by Delivery Service to the "delivery-status" Kafka topic
 * whenever a delivery's status changes.
 * Order Service consumes this event and updates the order status accordingly.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryStatusEvent {

    /** The orderId this delivery belongs to. */
    private Long orderId;

    /** The deliveries table primary key. */
    private Long deliveryId;

    /**
     * The new delivery status as a String so the consumer
     * can map it without a shared enum dependency.
     * Values: ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, FAILED
     */
    private String status;

    /** Timestamp when the status was updated. */
    private LocalDateTime timestamp;
}
