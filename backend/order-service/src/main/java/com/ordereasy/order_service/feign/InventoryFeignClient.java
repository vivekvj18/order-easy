package com.ordereasy.order_service.feign;

import com.ordereasy.order_service.dto.StockReleaseRequest;
import com.ordereasy.order_service.dto.StockReservationRequest;
import com.ordereasy.order_service.dto.StockReservationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client for calling Inventory Service endpoints.
 * - reserveStockBulk: reserves stock for all order items atomically (before saving order)
 * - releaseStock: releases a single item's reserved stock (best-effort rollback on delivery failure)
 */
@FeignClient(name = "inventory-service")
public interface InventoryFeignClient {

    @PostMapping("/stock/reserve-bulk")
    StockReservationResponse reserveStockBulk(@RequestBody StockReservationRequest request);

    @PutMapping("/stock/release")
    void releaseStock(@RequestBody StockReleaseRequest request);
}
