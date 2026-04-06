package com.ordereasy.delivery_service.strategy;

import com.ordereasy.delivery_service.entity.DeliveryPartner;
import com.ordereasy.delivery_service.event.OrderCreatedEvent;

import java.util.List;

public interface DeliveryAssignmentStrategy {
    DeliveryPartner assign(List<DeliveryPartner> partners, OrderCreatedEvent order);
}
