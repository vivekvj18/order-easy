package com.ordereasy.order_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotNull(message = "UserId cannot be null")
    private Long userId;

    @NotNull(message = "ProductId cannot be null")
    private Long productId;

    @NotNull(message = "Quantity cannot be null")
    @Positive(message = "Quantity must be greater than 0")
    private Integer quantity;

    @NotNull(message = "Total Amount is Required")
    @Positive(message = "Total amount must be greater than 0")
    private Double totalAmount;
}