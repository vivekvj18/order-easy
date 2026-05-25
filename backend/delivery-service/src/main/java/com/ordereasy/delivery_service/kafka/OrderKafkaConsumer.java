package com.ordereasy.delivery_service.kafka;

import com.ordereasy.delivery_service.event.PaymentCompletedEvent;
import com.ordereasy.delivery_service.service.DeliveryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;


@Slf4j
@Component
public class OrderKafkaConsumer {

    private final DeliveryService deliveryService;

    public OrderKafkaConsumer(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @KafkaListener(topics = "payment-completed", groupId = "delivery-group")
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        try {
            log.info("Received payment-completed event for orderId: {}, status: {}",
                    event.getOrderId(), event.getStatus());
            if (!"SUCCESS".equals(event.getStatus())) {
                log.warn("Payment not successful for orderId: {}. Skipping delivery assignment.",
                        event.getOrderId());
                return;
            }
            deliveryService.assignDeliveryFromPayment(event);
        } catch (Exception e) {
            log.error("Failed to process payment-completed event: {}", e.getMessage());
        }
    }
}