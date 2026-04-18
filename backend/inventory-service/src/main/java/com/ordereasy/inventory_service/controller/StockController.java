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

@RestController
@RequestMapping("/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping("/{productId}")
    public StockResponse getStock(@PathVariable Long productId) {
        return stockService.getStock(productId);
    }

    @PutMapping("/{productId}/add")
    public StockResponse addStock(@PathVariable Long productId,
                                  @Valid @RequestBody AddStockRequest request) {
        return stockService.addStock(productId, request);
    }

    @PutMapping("/reserve")
    public StockResponse reserveStock(@Valid @RequestBody ReserveStockRequest request) {
        return stockService.reserveStock(request);
    }

    @PutMapping("/release")
    public StockResponse releaseStock(@Valid @RequestBody ReserveStockRequest request) {
        return stockService.releaseStock(request);
    }

    // Called by Order Service via OpenFeign before saving any order
    @PostMapping("/reserve-bulk")
    public ResponseEntity<StockReservationResponse> reserveStockBulk(
            @RequestBody StockReservationRequest request) {
        StockReservationResponse response = stockService.reserveStockBulk(request);
        return ResponseEntity.ok(response);
    }
}
