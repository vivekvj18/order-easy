package com.ordereasy.tracking_service.controller;

import com.ordereasy.tracking_service.dto.LocationResponse;
import com.ordereasy.tracking_service.dto.LocationUpdateRequest;
import com.ordereasy.tracking_service.entity.LocationLog;
import com.ordereasy.tracking_service.service.TrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    @PostMapping("/update")
    public LocationResponse updateLocation(@Valid @RequestBody LocationUpdateRequest request) {
        log.info("Location update received — orderId: {}, partnerId: {}, lat: {}, lng: {}",
                request.getOrderId(), request.getPartnerId(),
                request.getLatitude(), request.getLongitude());

        LocationLog locationLog = LocationLog.builder()
                .orderId(request.getOrderId())
                .partnerId(request.getPartnerId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(request.getStatus())
                .build();

        LocationLog saved = trackingService.updateLocation(locationLog);
        log.info("Location saved successfully for orderId: {}", request.getOrderId());
        return mapToResponse(saved);
    }

    @GetMapping("/{orderId}")
    public LocationResponse getLatestLocation(@PathVariable Long orderId) {
        log.info("Fetching latest location for orderId: {}", orderId);
        LocationLog log2 = trackingService.getLatestLocation(orderId);
        log.info("Latest location for orderId: {} — lat: {}, lng: {}",
                orderId, log2.getLatitude(), log2.getLongitude());
        return mapToResponse(log2);
    }

    @GetMapping("/{orderId}/history")
    public List<LocationResponse> getHistory(@PathVariable Long orderId) {
        log.info("Fetching location history for orderId: {}", orderId);
        List<LocationResponse> history = trackingService.getLocationHistory(orderId)
                .stream()
                .map(this::mapToResponse)
                .toList();
        log.info("Returning {} location records for orderId: {}", history.size(), orderId);
        return history;
    }

    private LocationResponse mapToResponse(LocationLog locationLog) {
        return LocationResponse.builder()
                .orderId(locationLog.getOrderId())
                .partnerId(locationLog.getPartnerId())
                .latitude(locationLog.getLatitude())
                .longitude(locationLog.getLongitude())
                .timestamp(locationLog.getTimestamp())
                .status(locationLog.getStatus())
                .build();
    }
}