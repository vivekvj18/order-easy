package com.ordereasy.order_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotNull(message= "UserId cannot be null")
    private Long userId;

    @NotNull(message= "Total Amount is Required")
    @Positive(message = "Total amount must be greater than 0")
    private Double totalAmount;
}
