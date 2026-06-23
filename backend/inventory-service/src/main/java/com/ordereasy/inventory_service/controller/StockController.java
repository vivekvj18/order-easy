package com.ordereasy.inventory_service.controller;

import com.ordereasy.inventory_service.dto.AddStockRequest;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.dto.StockReservationRequest;
import com.ordereasy.inventory_service.dto.StockReservationResponse;
import com.ordereasy.inventory_service.dto.StockResponse;
import com.ordereasy.inventory_service.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for stock operations.
 *
 * /stock/{darkStoreId}/{productId}        — get stock for product in a specific dark store
 * /stock/{darkStoreId}/{productId}/add    — add stock to a product in a specific dark store
 * /stock/{darkStoreId}/reserve            — reserve single item (admin/internal)
 * /stock/{darkStoreId}/release            — release single item
 * /stock/reserve-bulk                     — bulk reservation with dark store selection (checkout path)
 */
@RestController
@RequestMapping("/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping("/{darkStoreId}/{productId}")
    public StockResponse getStock(@PathVariable Long darkStoreId,
                                   @PathVariable Long productId) {
        return stockService.getStock(darkStoreId, productId);
    }

    @PutMapping("/{darkStoreId}/{productId}/add")
    public StockResponse addStock(@PathVariable Long darkStoreId,
                                   @PathVariable Long productId,
                                   @Valid @RequestBody AddStockRequest request) {
        return stockService.addStock(darkStoreId, productId, request);
    }

    @PutMapping("/{darkStoreId}/reserve")
    public StockResponse reserveStock(@PathVariable Long darkStoreId,
                                       @Valid @RequestBody ReserveStockRequest request) {
        return stockService.reserveStock(darkStoreId, request);
    }

    @PutMapping("/{darkStoreId}/release")
    public StockResponse releaseStock(@PathVariable Long darkStoreId,
                                       @Valid @RequestBody ReserveStockRequest request) {
        return stockService.releaseStock(darkStoreId, request);
    }

    /**
     * Called by Order Service via OpenFeign during checkout.
     *
     * Performs Phase 0 (dark store selection) + Phase 1 + Phase 2 (two-phase reservation).
     * Returns the selected dark store details on success.
     */
    @PostMapping("/reserve-bulk")
    public ResponseEntity<StockReservationResponse> reserveStockBulk(
            @RequestBody StockReservationRequest request) {
        StockReservationResponse response = stockService.reserveStockBulk(request);
        return ResponseEntity.ok(response);
    }
}
