package com.ordereasy.cart_service.exception;

/**
 * Thrown when a request arrives without the required authentication headers
 * (X-User-Id / X-User-Role) and without a valid X-Internal-Service secret.
 * Results in HTTP 401 Unauthorized (handled by GlobalExceptionHandler).
 *
 * Distinct from AccessDeniedException (403) — here identity is absent entirely,
 * not merely insufficient.
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
