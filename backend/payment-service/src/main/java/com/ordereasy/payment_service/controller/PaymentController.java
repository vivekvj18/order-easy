package com.ordereasy.payment_service.controller;

import com.ordereasy.payment_service.dto.PaymentRequest;
import com.ordereasy.payment_service.entity.Payment;
import com.ordereasy.payment_service.repository.PaymentRepository;
import com.ordereasy.payment_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    // Admin — sabhi payments
    @GetMapping("/all")
    public List<Payment> getAllPayments() {
        log.info("Fetching all payments");
        List<Payment> payments = paymentRepository.findAll();
        log.info("Returning {} payments", payments.size());
        return payments;
    }

    // Specific order ka payment
    @GetMapping("/order/{orderId}")
    public ResponseEntity<Payment> getPaymentByOrderId(@PathVariable Long orderId) {
        log.info("Fetching payment for orderId: {}", orderId);
        return paymentRepository.findByOrderId(orderId)
                .map(payment -> {
                    log.info("Payment found for orderId: {} — status: {}",
                            orderId, payment.getStatus());
                    return ResponseEntity.ok(payment);
                })
                .orElseGet(() -> {
                    log.warn("No payment found for orderId: {}", orderId);
                    return ResponseEntity.notFound().build();
                });
    }

    // User ke saare payments
    @GetMapping("/user/{userId}")
    public List<Payment> getPaymentsByUserId(@PathVariable Long userId) {
        log.info("Fetching payments for userId: {}", userId);
        List<Payment> payments = paymentRepository.findByUserId(userId);
        log.info("Returning {} payments for userId: {}", payments.size(), userId);
        return payments;
    }

    @PostMapping("/pay/{orderId}")
    public ResponseEntity<Payment> initiatePayment(
            @PathVariable Long orderId,
            @RequestBody PaymentRequest request) {
        request.setOrderId(orderId);
        log.info("Pay Now triggered for orderId: {}", orderId);
        Payment payment = paymentService.initiatePayment(request);
        return ResponseEntity.ok(payment);
    }
}