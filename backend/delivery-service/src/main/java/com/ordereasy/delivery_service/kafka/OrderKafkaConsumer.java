package com.ordereasy.delivery_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordereasy.delivery_service.event.OrderCreatedEvent;
import com.ordereasy.delivery_service.service.DeliveryService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderKafkaConsumer {

    private final DeliveryService deliveryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderKafkaConsumer(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @KafkaListener(topics = "order-created", groupId = "delivery-group")
    public void handleOrderCreated(String message) {
        try {
            OrderCreatedEvent event = objectMapper.readValue(message, OrderCreatedEvent.class);
            deliveryService.assignDelivery(event);
        } catch (Exception e) {
            System.err.println("Failed to process order-created event: " + e.getMessage());
        }
    }
}