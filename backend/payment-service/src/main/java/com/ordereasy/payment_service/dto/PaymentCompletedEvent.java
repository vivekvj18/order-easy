package com.ordereasy.payment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Published to "payment-completed" Kafka topic.
 * Consumed by:
 *   - Inventory Service: finalizes stock at (darkStoreId + productId) level.
 *   - Order Service: transitions order status to PAYMENT_CONFIRMED.
 *   - Delivery Service: assigns delivery partner using dark store as pickup point.
 *
 * Dark store fields are propagated from order-created event.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCompletedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double amount;
    private String status;
    private String transactionId;
    private String deliverySlot;
    private List<OrderItemEvent> items;
    private Double deliveryLatitude;
    private Double deliveryLongitude;

    /** Dark store that fulfilled the order. Used by Inventory for stock finalization. */
    private Long darkStoreId;
    private String darkStoreName;
    private Double darkStoreLatitude;
    private Double darkStoreLongitude;
}
