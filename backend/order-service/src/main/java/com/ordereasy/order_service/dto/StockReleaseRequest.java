package com.ordereasy.order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Used for best-effort stock release when delivery assignment fails.
 * Maps to Inventory Service's existing PUT /stock/release endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReleaseRequest {
    private Long productId;
    private Integer quantity;
}
