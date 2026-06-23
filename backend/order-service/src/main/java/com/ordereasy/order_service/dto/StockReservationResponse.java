package com.ordereasy.order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from Inventory Service /stock/reserve-bulk.
 *
 * On success: success=true + selected dark store details.
 * On failure: success=false + message describing the reason.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservationResponse {
    private boolean success;
    private String message;

    /** ID of the dark store selected to fulfill this order. Null on failure. */
    private Long darkStoreId;

    private String darkStoreName;
    private Double darkStoreLatitude;
    private Double darkStoreLongitude;
}
