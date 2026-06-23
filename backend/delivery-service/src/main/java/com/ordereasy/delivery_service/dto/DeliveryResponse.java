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

    // Customer drop-off location
    private Double deliveryLatitude;
    private Double deliveryLongitude;

    // Dark store pickup location (new)
    private Long darkStoreId;
    private String darkStoreName;
    private Double pickupLatitude;
    private Double pickupLongitude;

    /** Total pickup-aware distance: riderToDarkStore + darkStoreToCustomer (km) */
    private Double assignmentDistanceKm;
    private DeliveryStatus status;
    private LocalDateTime assignedAt;
}
