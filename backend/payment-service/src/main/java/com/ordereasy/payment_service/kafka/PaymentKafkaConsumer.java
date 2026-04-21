package com.ordereasy.payment_service.kafka;

import com.ordereasy.payment_service.dto.OrderCreatedEvent;
import com.ordereasy.payment_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentKafkaConsumer {

    private final PaymentService paymentService;

    @KafkaListener(topics = "order-created", groupId = "payment-group")
    public void consumeOrderCreated(OrderCreatedEvent event) {
        log.info("Received order-created event for order: {}", event.getOrderId());
        paymentService.processPayment(event);
    }
}
