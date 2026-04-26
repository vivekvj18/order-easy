package com.ordereasy.delivery_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordereasy.delivery_service.event.OrderCreatedEvent;
import com.ordereasy.delivery_service.event.PaymentCompletedEvent;
import com.ordereasy.delivery_service.service.DeliveryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import static org.apache.kafka.common.requests.DeleteAclsResponse.log;

@Slf4j
@Component
public class OrderKafkaConsumer {

    private final DeliveryService deliveryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderKafkaConsumer(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @KafkaListener(topics = "order-created", groupId = "delivery-group")
    public void handleOrderCreated(OrderCreatedEvent event) {
        try {
            log.info("Received order-created event for orderId: {}", event.getOrderId());
            deliveryService.assignDelivery(event);
        } catch (Exception e) {
            log.error("Failed to process order-created event: {}", e.getMessage());
        }
    }
}