package com.ordereasy.tracking_service.service;

import com.ordereasy.tracking_service.entity.LocationLog;

import java.util.List;

public interface TrackingService {

    LocationLog updateLocation(LocationLog locationLog);

    LocationLog getLatestLocation(Long orderId);

    List<LocationLog> getLocationHistory(Long orderId);
}