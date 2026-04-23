package com.ordereasy.order_service.dto;

import com.ordereasy.order_service.enums.DeliverySlot;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotNull(message = "UserId cannot be null")
    private Long userId;

    @NotNull(message = "User email cannot be null")
    private String userEmail;

    @NotEmpty(message = "Order must have at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @NotNull(message = "Delivery slot cannot be null")
    private DeliverySlot deliverySlot;

    @NotNull(message = "Total amount cannot be null")
    private Double totalAmount;
}