package com.ordereasy.tracking_service.exception;

public class TrackingNotFoundException extends RuntimeException {

    public TrackingNotFoundException(String message) {
        super(message);
    }
}