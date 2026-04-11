package com.ordereasy.notification_service.kafka;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderCancelledEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private String reason;
}