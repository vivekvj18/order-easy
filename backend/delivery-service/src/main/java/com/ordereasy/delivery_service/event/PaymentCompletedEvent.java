package com.ordereasy.delivery_service.event;

import com.ordereasy.delivery_service.enums.DeliverySlot;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

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
}
