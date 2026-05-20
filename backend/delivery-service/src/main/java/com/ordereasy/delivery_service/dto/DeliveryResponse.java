package com.ordereasy.delivery_service.dto;

import com.ordereasy.delivery_service.entity.DeliveryStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeliveryResponse {

    private Long deliveryId;
    private Long orderId;
    private Long partnerId;
    private String partnerName;
    private String partnerPhone;
    private String partnerEmail;
    private Double partnerLatitude;
    private Double partnerLongitude;
    private Double deliveryLatitude;
    private Double deliveryLongitude;
    private Double assignmentDistanceKm;
    private DeliveryStatus status;
    private LocalDateTime assignedAt;
}
