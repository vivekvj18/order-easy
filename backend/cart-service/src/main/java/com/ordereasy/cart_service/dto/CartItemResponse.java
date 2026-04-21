package com.ordereasy.cart_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Double price;
    private Integer quantity;
    private Double subtotal;
}
