package com.ordereasy.delivery_service.strategy;

import com.ordereasy.delivery_service.entity.DeliveryPartner;
import com.ordereasy.delivery_service.event.OrderCreatedEvent;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class FirstAvailableStrategy implements DeliveryAssignmentStrategy {

    @Override
    public DeliveryPartner assign(List<DeliveryPartner> partners, OrderCreatedEvent order) {

        if (partners == null || partners.isEmpty()) {
            throw new RuntimeException("No delivery partner available");
        }

        return partners.get(0);
    }
}