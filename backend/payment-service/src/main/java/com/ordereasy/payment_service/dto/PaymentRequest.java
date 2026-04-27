package com.ordereasy.payment_service.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double amount;
}