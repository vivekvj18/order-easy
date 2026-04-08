package com.ordereasy.tracking_service.dto;

import com.ordereasy.tracking_service.entity.Status;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LocationUpdateRequest {

    @NotNull
    private Long orderId;

    @NotNull
    private Long partnerId;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotNull
    private Status status;
}