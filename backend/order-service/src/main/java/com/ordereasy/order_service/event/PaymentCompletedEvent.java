package com.ordereasy.order_service.event;

import lombok.Getter;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Event received from Payment Service on the "payment-completed" Kafka topic.
 * Order Service uses this to transition PENDING_PAYMENT → PAYMENT_CONFIRMED.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaymentCompletedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double amount;
    private String status;
    private String transactionId;
}
