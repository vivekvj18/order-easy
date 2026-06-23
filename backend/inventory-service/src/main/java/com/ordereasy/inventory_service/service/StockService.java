package com.ordereasy.inventory_service.service;

import com.ordereasy.inventory_service.dto.AddStockRequest;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.dto.StockReservationRequest;
import com.ordereasy.inventory_service.dto.StockReservationResponse;
import com.ordereasy.inventory_service.dto.StockResponse;
import com.ordereasy.inventory_service.event.OrderItemEvent;

import java.util.List;

public interface StockService {

    StockResponse getStock(Long darkStoreId, Long productId);

    StockResponse addStock(Long darkStoreId, Long productId, AddStockRequest request);

    StockResponse reserveStock(Long darkStoreId, ReserveStockRequest request);

    StockResponse releaseStock(Long darkStoreId, ReserveStockRequest request);

    /**
     * Phase 0 (dark store selection) + Phase 1 + Phase 2 (two-phase reservation).
     *
     * Phase 0: Select nearest fulfillable dark store using bounding box + Haversine.
     * Phase 1: Validate all cart items exist and are available in the selected store.
     * Phase 2: Increment reservedQuantity for all validated items.
     *
     * @param request contains userLatitude, userLongitude, and cart items
     * @return response with success flag and selected dark store details
     */
    StockReservationResponse reserveStockBulk(StockReservationRequest request);

    /**
     * Finalizes reserved stock after a successful payment.
     * For each item: decreases quantity AND reservedQuantity by the ordered amount.
     * Protected by idempotency — duplicate calls for the same orderId are ignored.
     *
     * @param orderId     the order whose stock should be finalized
     * @param darkStoreId the dark store from which the order was fulfilled
     * @param items       the list of items (productId + quantity) from PaymentCompletedEvent
     */
    void finalizeReservedStock(Long orderId, Long darkStoreId, List<OrderItemEvent> items);

    /**
     * Releases reserved stock for all items in an order (order cancellation).
     *
     * @param darkStoreId the dark store from which the order was reserved
     * @param items       the list of items to release
     */
    void releaseReservedStockForOrder(Long darkStoreId, List<OrderItemEvent> items);
}
