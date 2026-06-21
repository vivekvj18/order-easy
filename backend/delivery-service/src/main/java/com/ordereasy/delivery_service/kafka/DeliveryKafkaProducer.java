package com.ordereasy.delivery_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ordereasy.delivery_service.event.DeliveryStatusEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes delivery status change events to the "delivery-status" Kafka topic.
 * Order Service consumes these events to keep order status in sync.
 */
@Slf4j
@Component
public class DeliveryKafkaProducer {

    private static final String TOPIC = "delivery-status";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public DeliveryKafkaProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Publishes a delivery status event.
     *
     * @param event the event containing orderId, deliveryId, status, and timestamp
     */
    public void sendDeliveryStatusEvent(DeliveryStatusEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, payload);
            log.info("[DeliveryKafka] Published delivery-status event: orderId={}, deliveryId={}, status={}",
                    event.getOrderId(), event.getDeliveryId(), event.getStatus());
        } catch (Exception e) {
            log.error("[DeliveryKafka] Failed to publish delivery-status event for orderId={}: {}",
                    event.getOrderId(), e.getMessage(), e);
        }
    }
}
