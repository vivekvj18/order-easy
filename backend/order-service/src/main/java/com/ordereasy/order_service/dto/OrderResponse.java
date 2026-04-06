package com.ordereasy.order_service.dto;

import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.enums.DeliverySlot;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long orderId;
    private Long userId;
    private OrderStatus status;
    private Double totalAmount;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
    private DeliverySlot deliverySlot;
}