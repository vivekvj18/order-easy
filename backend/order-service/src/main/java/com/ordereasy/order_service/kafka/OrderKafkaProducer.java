package com.ordereasy.order_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordereasy.order_service.event.OrderCancelledEvent;
import com.ordereasy.order_service.event.OrderCreatedEvent;
import com.ordereasy.order_service.event.OrderStatusUpdatedEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderKafkaProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderKafkaProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendOrderCreatedEvent(OrderCreatedEvent event) {
        try {
            kafkaTemplate.send("order-created", objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            throw new RuntimeException("Failed to send order-created event", e);
        }
    }

    public void sendOrderCancelledEvent(OrderCancelledEvent event) {
        try {
            kafkaTemplate.send("order-cancelled", objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            throw new RuntimeException("Failed to send order-cancelled event", e);
        }
    }

    public void sendOrderStatusUpdatedEvent(OrderStatusUpdatedEvent event) {
        try {
            kafkaTemplate.send("order-status-updated", objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            throw new RuntimeException("Failed to send order-status-updated event", e);
        }
    }
}