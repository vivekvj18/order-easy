package com.ordereasy.order_service.event;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Event received from Delivery Service on the "delivery-status" Kafka topic.
 * Order Service uses this to update order status based on delivery progress.
 */
@Getter
@Setter
public class DeliveryStatusEvent {
    private Long orderId;
    private Long deliveryId;
    private String status;
    private LocalDateTime timestamp;
}
