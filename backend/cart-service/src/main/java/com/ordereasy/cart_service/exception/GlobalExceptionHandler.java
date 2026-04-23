package com.ordereasy.cart_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleServiceUnavailableException(ServiceUnavailableException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "FAILED");
        response.put("message", ex.getMessage());
        response.put("data", null);
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(io.github.resilience4j.circuitbreaker.CallNotPermittedException.class)
    public ResponseEntity<Map<String, Object>> handleCallNotPermittedException(io.github.resilience4j.circuitbreaker.CallNotPermittedException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "FAILED");
        response.put("message", "Service is currently unavailable (Circuit Breaker OPEN)");
        response.put("data", null);
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "FAILED");
        response.put("message", "Internal Server Error: " + ex.getMessage());
        response.put("data", null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
