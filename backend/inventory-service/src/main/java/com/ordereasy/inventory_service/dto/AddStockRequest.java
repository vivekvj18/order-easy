package com.ordereasy.inventory_service.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddStockRequest {

    @NotNull
    @Positive
    private Integer quantity;
}
