package com.ordereasy.payment_service.service;

import com.ordereasy.payment_service.dto.OrderCreatedEvent;
import com.ordereasy.payment_service.dto.PaymentCompletedEvent;
import com.ordereasy.payment_service.dto.PaymentRequest;
import com.ordereasy.payment_service.dto.PaymentSummaryResponse;
import com.ordereasy.payment_service.entity.Payment;
import com.ordereasy.payment_service.exception.DuplicateIdempotencyKeyException;
import com.ordereasy.payment_service.repository.PaymentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
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

        // Publish event — include dark store fields so Inventory can finalize
        // at (darkStoreId + productId) level, not global productId level.
        PaymentCompletedEvent completedEvent = PaymentCompletedEvent.builder()
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .userEmail(event.getUserEmail())
                .amount(event.getTotalAmount())
                .status(status)
                .transactionId(transactionId)
                .deliverySlot(event.getDeliverySlot())
                .items(event.getItems())
                .deliveryLatitude(event.getDeliveryLatitude())
                .deliveryLongitude(event.getDeliveryLongitude())
                .darkStoreId(event.getDarkStoreId())
                .darkStoreName(event.getDarkStoreName())
                .darkStoreLatitude(event.getDarkStoreLatitude())
                .darkStoreLongitude(event.getDarkStoreLongitude())
                .build();

        kafkaTemplate.send("payment-completed", completedEvent);
        log.info("Payment completed for order: {}, status: {}", event.getOrderId(), status);
    }

    @Transactional
    public Payment initiatePayment(PaymentRequest request, String idempotencyKey) {
        log.info("Manual payment initiated for orderId: {}, idempotencyKey: {}",
                request.getOrderId(), idempotencyKey);

        // ── Idempotency-key check (client-supplied key) ────────────────────
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            return paymentRepository.findByIdempotencyKey(idempotencyKey)
                    .map(existing -> {
                        if (!existing.getOrderId().equals(request.getOrderId())) {
                            // Same key but different orderId → 409 Conflict
                            log.warn("[Idempotency] Key '{}' already used for orderId: {} " +
                                            "but new request is for orderId: {}. Returning 409.",
                                    idempotencyKey, existing.getOrderId(), request.getOrderId());
                            throw new DuplicateIdempotencyKeyException(
                                    "Idempotency key '" + idempotencyKey +
                                    "' already used for a different orderId: " + existing.getOrderId());
                        }
                        // Same key + same orderId → return existing, no duplicate event
                        log.info("[Idempotency] Duplicate request detected for key: '{}', orderId: {}. " +
                                "Returning existing payment id: {}", idempotencyKey,
                                request.getOrderId(), existing.getId());
                        return existing;
                    })
                    .orElseGet(() -> createAndPublishPayment(request, idempotencyKey));
        }

        // ── Fallback: orderId-level idempotency (no key provided) ─────────
        return paymentRepository.findByOrderId(request.getOrderId())
                .orElseGet(() -> createAndPublishPayment(request, null));
    }

    /**
     * Creates a new Payment row, publishes payment-completed, and returns the saved entity.
     *
     * Bug fix: PaymentCompletedEvent MUST include items + darkStoreId.
     *   - items: Inventory Service finalizes stock per productId.
     *   - darkStoreId: stock is now at (darkStoreId + productId), not global.
     * Without them, Inventory's guards drop the event and reservedQuantity never clears.
     *
     * If a DB unique-constraint violation occurs (race condition on idempotency key),
     * fetches and returns the already-committed row — no duplicate event is published.
     */
    private Payment createAndPublishPayment(PaymentRequest request, String idempotencyKey) {
        try {
            String transactionId = UUID.randomUUID().toString();

            Payment payment = Payment.builder()
                    .orderId(request.getOrderId())
                    .userId(request.getUserId())
                    .amount(request.getAmount())
                    .status("SUCCESS")
                    .transactionId(transactionId)
                    .createdAt(LocalDateTime.now())
                    .idempotencyKey(idempotencyKey)
                    .build();

            Payment saved = paymentRepository.save(payment);

            PaymentCompletedEvent completedEvent = PaymentCompletedEvent.builder()
                    .orderId(request.getOrderId())
                    .userId(request.getUserId())
                    .userEmail(request.getUserEmail())
                    .amount(request.getAmount())
                    .status("SUCCESS")
                    .transactionId(transactionId)
                    .items(request.getItems())              // required: Inventory finalizes per item
                    .darkStoreId(request.getDarkStoreId())  // required: dark-store-scoped deduction
                    .deliverySlot(request.getDeliverySlot())
                    .deliveryLatitude(request.getDeliveryLatitude())
                    .deliveryLongitude(request.getDeliveryLongitude())
                    .build();

            kafkaTemplate.send("payment-completed", completedEvent);
            log.info("[Payment] SUCCESS for orderId: {}, txnId: {}, idempotencyKey: {}, darkStoreId: {}",
                    request.getOrderId(), transactionId, idempotencyKey, request.getDarkStoreId());

            return saved;

        } catch (DataIntegrityViolationException ex) {
            // Race condition: another request with the same idempotency key committed first
            log.warn("[Idempotency] Unique constraint violation for key: '{}'. " +
                    "Fetching already-committed payment for orderId: {}",
                    idempotencyKey, request.getOrderId());
            return paymentRepository.findByIdempotencyKey(idempotencyKey)
                    .orElseGet(() -> paymentRepository.findByOrderId(request.getOrderId())
                            .orElseThrow(() -> new RuntimeException(
                                    "Payment not found after constraint violation for orderId: "
                                    + request.getOrderId())));
        }
    }

    public PaymentSummaryResponse getPaymentSummary() {
        long total = paymentRepository.count();
        long success = paymentRepository.countByStatus("SUCCESS");
        long failed = paymentRepository.countByStatus("FAILED");
        Double collected = paymentRepository.sumTotalAmountCollected();

        return PaymentSummaryResponse.builder()
                .totalPayments(total)
                .successPayments(success)
                .failedPayments(failed)
                .totalAmountCollected(collected != null ? collected : 0.0)
                .build();
    }
}
