package com.ordereasy.inventory_service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StockResponse {

    private Long productId;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
}
