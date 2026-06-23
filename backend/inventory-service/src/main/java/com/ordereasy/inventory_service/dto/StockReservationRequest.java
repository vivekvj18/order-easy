package com.ordereasy.inventory_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Bulk stock reservation request sent by Order Service to Inventory Service.
 *
 * New fields:
 *   - userLatitude / userLongitude: user's delivery coordinates.
 *     Used to find the nearest fulfillable dark store during Phase 0 (store selection).
 *
 * Interview note:
 *   Dark store selection (Phase 0) happens BEFORE the two-phase reservation.
 *   Once a fulfillable dark store is selected, the same Phase 1 + Phase 2 logic
 *   runs at (darkStoreId + productId) level — unchanged conceptually.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservationRequest {

    /** User's delivery latitude — used to find nearest fulfillable dark store. */
    private Double userLatitude;

    /** User's delivery longitude — used to find nearest fulfillable dark store. */
    private Double userLongitude;

    /** Cart items to reserve. */
    private List<StockItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockItem {
        private Long productId;
        private Integer quantity;
    }
}
