package com.ordereasy.notification_service.kafka;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderCreatedEvent {
    private Long orderId;
    private Long userId;
    private String userEmail;
}