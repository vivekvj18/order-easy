package com.ordereasy.cart_service.exception;

/**
 * Thrown when an authenticated user tries to access a cart they do not own.
 * Results in HTTP 403 Forbidden (handled by GlobalExceptionHandler).
 */
public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) {
        super(message);
    }
}
