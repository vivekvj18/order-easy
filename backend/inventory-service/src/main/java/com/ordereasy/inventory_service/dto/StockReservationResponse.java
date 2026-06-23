package com.ordereasy.inventory_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from Inventory Service's /stock/reserve-bulk endpoint.
 *
 * On success, includes the selected dark store's details so Order Service
 * can persist them in the order table and propagate them downstream.
 *
 * On failure, success=false and message describes the reason.
 *
 * Example success:
 * {
 *   "success": true,
 *   "message": "Stock reserved successfully",
 *   "darkStoreId": 2,
 *   "darkStoreName": "Neeladri Nagar Dark Store",
 *   "darkStoreLatitude": 12.8508,
 *   "darkStoreLongitude": 77.6534
 * }
 *
 * Example failure:
 * {
 *   "success": false,
 *   "message": "No nearby dark store can fulfill the complete cart"
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservationResponse {

    private boolean success;
    private String message;

    /** ID of the selected dark store. Null on failure. */
    private Long darkStoreId;

    /** Human-readable name of the selected dark store. */
    private String darkStoreName;

    /** Latitude of the selected dark store (used as delivery pickup point). */
    private Double darkStoreLatitude;

    /** Longitude of the selected dark store (used as delivery pickup point). */
    private Double darkStoreLongitude;
}
