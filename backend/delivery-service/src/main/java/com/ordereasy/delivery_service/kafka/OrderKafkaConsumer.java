package com.ordereasy.delivery_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordereasy.delivery_service.event.PaymentCompletedEvent;
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

    @KafkaListener(topics = "payment-completed", groupId = "delivery-group")
    public void handlePaymentCompleted(String message) {
        try {
            PaymentCompletedEvent event = objectMapper.readValue(message, PaymentCompletedEvent.class);
            if ("SUCCESS".equals(event.getStatus())) {
                deliveryService.assignDeliveryFromPayment(event);
            }
        } catch (Exception e) {
            System.err.println("Failed to process payment-completed event: " + e.getMessage());
        }
    }
}