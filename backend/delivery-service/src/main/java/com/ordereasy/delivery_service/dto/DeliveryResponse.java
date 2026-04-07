package com.ordereasy.delivery_service.dto;

import com.ordereasy.delivery_service.entity.DeliveryStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeliveryResponse {

    private Long orderId;
    private Long partnerId;
    private String partnerName;
    private DeliveryStatus status;
    private LocalDateTime assignedAt;
}