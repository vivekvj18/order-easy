package com.ordereasy.payment_service.dto;

import lombok.Data;
import java.util.List;

/**
 * Event received from "order-created" Kafka topic.
 * Payment Service processes this to initiate payment.
 *
 * Dark store fields are now included and must be propagated to
 * payment-completed so Inventory Service can finalize stock at
 * (darkStoreId + productId) level.
 */
@Data
public class OrderCreatedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double totalAmount;
    private String deliverySlot;
    private List<OrderItemEvent> items;
    private Double deliveryLatitude;
    private Double deliveryLongitude;

    /** Dark store selected for this order. Must be propagated to payment-completed. */
    private Long darkStoreId;
    private String darkStoreName;
    private Double darkStoreLatitude;
    private Double darkStoreLongitude;
}
