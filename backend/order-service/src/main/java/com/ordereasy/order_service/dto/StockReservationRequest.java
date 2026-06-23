package com.ordereasy.order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Sent by Order Service to Inventory Service /stock/reserve-bulk.
 *
 * Now includes userLatitude and userLongitude so Inventory Service can
 * perform Phase 0 (dark store selection) before the two-phase reservation.
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
