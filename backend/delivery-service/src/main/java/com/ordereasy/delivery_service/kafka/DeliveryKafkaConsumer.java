package com.ordereasy.delivery_service.kafka;

import com.ordereasy.delivery_service.event.OrderCreatedEvent;
import com.ordereasy.delivery_service.service.DeliveryService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class DeliveryKafkaConsumer {

    private final DeliveryService deliveryService;

    public DeliveryKafkaConsumer(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @KafkaListener(topics = "order-created", groupId = "delivery-group")
    public void handleOrderCreated(OrderCreatedEvent event) {
        deliveryService.assignDelivery(event);
    }
}