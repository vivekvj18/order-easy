package com.ordereasy.payment_service.service;

import com.ordereasy.payment_service.dto.OrderCreatedEvent;
import com.ordereasy.payment_service.dto.PaymentCompletedEvent;
import com.ordereasy.payment_service.entity.Payment;
import com.ordereasy.payment_service.repository.PaymentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public void processPayment(OrderCreatedEvent event) {
        log.info("Processing payment for order: {}", event.getOrderId());

        // Idempotency check
        if (paymentRepository.findByOrderId(event.getOrderId()).isPresent()) {
            log.warn("Payment already processed for order: {}", event.getOrderId());
            return;
        }

        // Simulate payment logic
        String status = "SUCCESS"; // In real world, call payment gateway
        String transactionId = UUID.randomUUID().toString();

        Payment payment = Payment.builder()
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .amount(event.getTotalAmount())
                .status(status)
                .transactionId(transactionId)
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        // Publish event
        PaymentCompletedEvent completedEvent = PaymentCompletedEvent.builder()
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .userEmail(event.getUserEmail())
                .amount(event.getTotalAmount())
                .status(status)
                .transactionId(transactionId)
                .deliverySlot(event.getDeliverySlot())
                .items(event.getItems())
                .build();

        kafkaTemplate.send("payment-completed", completedEvent);
        log.info("Payment completed for order: {}, status: {}", event.getOrderId(), status);
    }
}
