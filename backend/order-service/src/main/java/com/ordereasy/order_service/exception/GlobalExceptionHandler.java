package com.ordereasy.order_service.exception;

import feign.FeignException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ✅ Handles @Valid failures (e.g. missing/invalid fields)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> response = new HashMap<>();
        response.put("status", 400);
        response.put("error", "Validation Failed");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("errors", fieldErrors);

        return ResponseEntity.badRequest().body(response);
    }

    // ✅ Handles order not found → clean 404
    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleOrderNotFoundException(
            OrderNotFoundException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("status", 404);
        response.put("error", "Order Not Found");
        response.put("message", ex.getMessage());
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // ✅ When Inventory/Delivery Service returns a non-2xx response via Feign,
    //    extract the real message from the response body so users get a meaningful reason
    //    (e.g. "Insufficient stock" or "Stock not found for product id: X") instead of
    //    the generic "Inventory service unavailable" that was silencing real errors.
    @ExceptionHandler(FeignException.class)
    public ResponseEntity<Map<String, String>> handleFeignException(FeignException ex) {
        Map<String, String> error = new HashMap<>();

        // Try to pull the actual error body from the downstream service
        String downstreamMessage = null;
        try {
            if (ex.responseBody().isPresent()) {
                String body = new String(ex.responseBody().get().array());
                // Body is typically {"message":"...","status":...}
                // Simple extraction without a full JSON parser
                if (body.contains("\"message\"")) {
                    int start = body.indexOf("\"message\"") + 11; // skip past "message":
                    // skip optional whitespace, colon, and opening quote
                    while (start < body.length() && (body.charAt(start) == ' ' || body.charAt(start) == ':')) start++;
                    if (start < body.length() && body.charAt(start) == '"') start++;
                    int end = body.indexOf('"', start);
                    if (end > start) {
                        downstreamMessage = body.substring(start, end);
                    }
                }
            }
        } catch (Exception ignored) { }

        if (downstreamMessage != null && !downstreamMessage.isBlank()) {
            error.put("error", downstreamMessage);
        } else {
            error.put("error", "Inventory service unavailable. Please try again.");
        }
        error.put("status", "SERVICE_UNAVAILABLE");

        // Mirror 4xx status codes from downstream (e.g. 404 = stock not found, 400 = bad request)
        // Only use 503 for genuine connectivity failures
        HttpStatus status = (ex.status() >= 400 && ex.status() < 500)
                ? HttpStatus.valueOf(ex.status())
                : HttpStatus.SERVICE_UNAVAILABLE;

        return ResponseEntity.status(status).body(error);
    }

    // ✅ When stock is unavailable or any business logic failure (e.g. from Feign response)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        error.put("status", "BAD_REQUEST");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // ✅ Handle Resilience4j Circuit Breaker (When circuit is OPEN)
    @ExceptionHandler(io.github.resilience4j.circuitbreaker.CallNotPermittedException.class)
    public ResponseEntity<Map<String, Object>> handleCallNotPermittedException(
            io.github.resilience4j.circuitbreaker.CallNotPermittedException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("status", "FAILED");
        response.put("message", "Service is currently unavailable (Circuit Breaker OPEN)");
        response.put("data", null);
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    // ✅ Handle Fallback triggers (Custom Exception)
    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleServiceUnavailableException(
            ServiceUnavailableException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("status", "FAILED");
        response.put("message", ex.getMessage());
        response.put("data", null);
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    // ✅ Catch-all for unexpected errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("status", 500);
        response.put("error", "Internal Server Error");
        response.put("message", "Something went wrong. Please try again.");
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}