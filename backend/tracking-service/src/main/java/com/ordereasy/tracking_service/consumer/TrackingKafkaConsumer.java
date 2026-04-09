package com.ordereasy.tracking_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordereasy.tracking_service.dto.OrderCreatedEvent;
import com.ordereasy.tracking_service.entity.LocationLog;
import com.ordereasy.tracking_service.entity.Status;
import com.ordereasy.tracking_service.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TrackingKafkaConsumer {

    private final TrackingService trackingService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "order-created", groupId = "tracking-group")
    public void consumeOrderCreated(String message) {
        try {
            // JSON string → Java object
            OrderCreatedEvent event = objectMapper.readValue(message, OrderCreatedEvent.class);

            LocationLog log = LocationLog.builder()
                    .orderId(event.getOrderId())
                    .partnerId(null)
                    .latitude(0.0)
                    .longitude(0.0)
                    .status(Status.ASSIGNED)
                    .build();

            trackingService.updateLocation(log);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}