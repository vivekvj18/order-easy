package com.ordereasy.tracking_service.controller;

import com.ordereasy.tracking_service.dto.LocationResponse;
import com.ordereasy.tracking_service.dto.LocationUpdateRequest;
import com.ordereasy.tracking_service.entity.LocationLog;
import com.ordereasy.tracking_service.service.TrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    // 🔹 Update location (Rider)
    @PostMapping("/update")
    public LocationResponse updateLocation(@Valid @RequestBody LocationUpdateRequest request) {

        LocationLog locationLog = LocationLog.builder()
                .orderId(request.getOrderId())
                .partnerId(request.getPartnerId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(request.getStatus())
                .build();

        LocationLog saved = trackingService.updateLocation(locationLog);

        return mapToResponse(saved);
    }

    // 🔹 Get latest location (Customer)
    @GetMapping("/{orderId}")
    public LocationResponse getLatestLocation(@PathVariable Long orderId) {
        LocationLog log = trackingService.getLatestLocation(orderId);
        return mapToResponse(log);
    }

    // 🔹 Get full history (Admin)
    @GetMapping("/{orderId}/history")
    public List<LocationResponse> getHistory(@PathVariable Long orderId) {
        return trackingService.getLocationHistory(orderId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // 🔹 Mapper method
    private LocationResponse mapToResponse(LocationLog log) {
        return LocationResponse.builder()
                .orderId(log.getOrderId())
                .partnerId(log.getPartnerId())
                .latitude(log.getLatitude())
                .longitude(log.getLongitude())
                .timestamp(log.getTimestamp())
                .status(log.getStatus())
                .build();
    }
}