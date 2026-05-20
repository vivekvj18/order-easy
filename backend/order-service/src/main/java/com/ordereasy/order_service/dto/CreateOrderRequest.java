package com.ordereasy.order_service.dto;

import com.ordereasy.order_service.enums.DeliverySlot;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "Delivery address cannot be blank")
    private String deliveryAddress;

    @NotNull(message = "Total amount cannot be null")
    private Double totalAmount;

    @NotNull(message = "Delivery latitude cannot be null")
    @DecimalMin(value = "-90.0", message = "Delivery latitude must be at least -90")
    @DecimalMax(value = "90.0", message = "Delivery latitude must be at most 90")
    private Double deliveryLatitude;

    @NotNull(message = "Delivery longitude cannot be null")
    @DecimalMin(value = "-180.0", message = "Delivery longitude must be at least -180")
    @DecimalMax(value = "180.0", message = "Delivery longitude must be at most 180")
    private Double deliveryLongitude;
}
