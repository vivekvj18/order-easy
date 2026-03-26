package com.ordereasy.order_service.dto;

import com.ordereasy.order_service.entity.OrderStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderResponse {
    private Long orderId;
    private OrderStatus status;
    public OrderResponse(Long orderId, OrderStatus status) {
        this.orderId = orderId;
        this.status = status;
    }
}
