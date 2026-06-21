package com.ordereasy.inventory_service.service;

import com.ordereasy.inventory_service.dto.AddStockRequest;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.dto.StockReservationRequest;
import com.ordereasy.inventory_service.dto.StockReservationResponse;
import com.ordereasy.inventory_service.dto.StockResponse;
import com.ordereasy.inventory_service.event.OrderItemEvent;

import java.util.List;

public interface StockService {

    StockResponse getStock(Long productId);

    StockResponse addStock(Long productId, AddStockRequest request);

    StockResponse reserveStock(ReserveStockRequest request);

    StockResponse releaseStock(ReserveStockRequest request);

    StockReservationResponse reserveStockBulk(StockReservationRequest request);

    /**
     * Finalizes reserved stock after a successful payment.
     * For each item: decreases quantity AND reservedQuantity by the ordered amount.
     * Protected by idempotency — duplicate calls for the same orderId are ignored.
     *
     * @param orderId the order whose stock should be finalized
     * @param items   the list of items (productId + quantity) from the PaymentCompletedEvent
     */
    void finalizeReservedStock(Long orderId, List<OrderItemEvent> items);
}
