package com.ordereasy.payment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
}
