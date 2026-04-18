package com.ordereasy.inventory_service.service;

import com.ordereasy.inventory_service.dto.AddStockRequest;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.dto.StockReservationRequest;
import com.ordereasy.inventory_service.dto.StockReservationResponse;
import com.ordereasy.inventory_service.dto.StockResponse;

public interface StockService {

    StockResponse getStock(Long productId);

    StockResponse addStock(Long productId, AddStockRequest request);

    StockResponse reserveStock(ReserveStockRequest request);

    StockResponse releaseStock(ReserveStockRequest request);

    StockReservationResponse reserveStockBulk(StockReservationRequest request);
}
