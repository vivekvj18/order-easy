package com.ordereasy.delivery_service.event;

import com.ordereasy.delivery_service.enums.DeliverySlot;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Consumed from "payment-completed" Kafka topic.
 * Delivery Service uses this to assign a delivery partner.
 *
 * Dark store fields: the selected dark store is the PICKUP location.
 *   - darkStoreLatitude + darkStoreLongitude → pickup coordinates
 *   - deliveryLatitude + deliveryLongitude   → drop-off coordinates
 *
 * This replaces the previous pattern of using the order-created event
 * for delivery assignment (delivery now triggers after payment).
 */
@Getter
@Setter
public class PaymentCompletedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double amount;
    private String status;
    private String transactionId;
    private List<OrderItemEvent> items;
    private String deliverySlot;
    private Double deliveryLatitude;
    private Double deliveryLongitude;

    /** Dark store location — used as the delivery pickup point. */
    private Long darkStoreId;
    private String darkStoreName;
    private Double darkStoreLatitude;
    private Double darkStoreLongitude;
}
