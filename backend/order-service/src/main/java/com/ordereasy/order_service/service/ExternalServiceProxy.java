package com.ordereasy.order_service.service;

import com.ordereasy.order_service.dto.CartResponse;
import com.ordereasy.order_service.dto.StockReservationRequest;
import com.ordereasy.order_service.dto.StockReservationResponse;
import com.ordereasy.order_service.exception.ServiceUnavailableException;
import com.ordereasy.order_service.feign.CartFeignClient;
import com.ordereasy.order_service.feign.InventoryFeignClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExternalServiceProxy {

    private final CartFeignClient cartFeignClient;
    private final InventoryFeignClient inventoryFeignClient;

    @CircuitBreaker(name = "cartServiceCB", fallbackMethod = "handleCartFallback")
    public CartResponse getCart(Long userId) {
        return cartFeignClient.getCart(userId);
    }

    @CircuitBreaker(name = "inventoryServiceCB", fallbackMethod = "handleInventoryFallback")
    public StockReservationResponse reserveStockBulk(StockReservationRequest request) {
        return inventoryFeignClient.reserveStockBulk(request);
    }

    @CircuitBreaker(name = "cartServiceCB", fallbackMethod = "handleVoidFallback")
    public void clearCart(Long userId) {
        cartFeignClient.clearCart(userId);
    }

    @CircuitBreaker(name = "inventoryServiceCB", fallbackMethod = "handleVoidFallback")
    public void releaseStock(com.ordereasy.order_service.dto.StockReleaseRequest request) {
        inventoryFeignClient.releaseStock(request);
    }

    // Fallbacks
    public CartResponse handleCartFallback(Long userId, Exception e) {
        log.warn("Cart service failed for userId: {}, fail-fast with graceful degradation triggered. Error: {}", userId, e.getMessage());
        throw new ServiceUnavailableException("Cart service unavailable");
    }

    public StockReservationResponse handleInventoryFallback(StockReservationRequest request, Exception e) {
        log.warn("Inventory service failed, fail-fast with graceful degradation triggered. Error: {}", e.getMessage());
        throw new ServiceUnavailableException("Inventory service unavailable");
    }

    public void handleVoidFallback(Object any, Exception e) {
        log.warn("Downstream service failed (void call), fail-fast with graceful degradation triggered. Error: {}", e.getMessage());
        // For void calls like clearCart or releaseStock, we might not want to throw
        // depending on whether they are critical for the business flow.
        // Usually, best-effort calls don't rethrow, but here we can throw to be consistent
        // with the requirement of structured error responses.
        throw new ServiceUnavailableException("Downstream service unavailable");
    }
}
