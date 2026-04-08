package com.ordereasy.tracking_service.service;

import com.ordereasy.tracking_service.entity.LocationLog;
import com.ordereasy.tracking_service.repository.LocationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrackingServiceImpl implements TrackingService {

    private final LocationLogRepository locationLogRepository;

    @Override
    public LocationLog updateLocation(LocationLog locationLog) {

        // timestamp set karna zaroori hai
        locationLog.setTimestamp(LocalDateTime.now());

        return locationLogRepository.save(locationLog);
    }

    @Override
    public LocationLog getLatestLocation(Long orderId) {
        return locationLogRepository
                .findTopByOrderIdOrderByTimestampDesc(orderId)
                .orElseThrow(() -> new RuntimeException("Tracking not found for order: " + orderId));
    }

    @Override
    public List<LocationLog> getLocationHistory(Long orderId) {
        return locationLogRepository.findByOrderIdOrderByTimestampDesc(orderId);
    }
}