package com.ordereasy.tracking_service.dto;

import com.ordereasy.tracking_service.entity.Status;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LocationResponse {

    private Long orderId;
    private Long partnerId;
    private Double latitude;
    private Double longitude;
    private LocalDateTime timestamp;
    private Status status;
}