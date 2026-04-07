package com.ordereasy.delivery_service.dto;

import com.ordereasy.delivery_service.entity.DeliveryStatus;
import lombok.Data;

@Data
public class UpdateDeliveryStatusRequest {

    private DeliveryStatus status;
}
