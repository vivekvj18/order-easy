package com.ordereasy.order_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.event.DeliveryStatusEvent;
import com.ordereasy.order_service.event.PaymentCompletedEvent;
import com.ordereasy.order_service.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Order Service Kafka consumer.
 *
 * Listens on:
 *   - "payment-completed"  → PENDING_PAYMENT → PAYMENT_CONFIRMED
 *   - "delivery-status"    → maps delivery status to order status
 *
 * Updates Order directly via OrderRepository to avoid circular dependencies
 * with OrderService (which also calls kafkaProducer).
 */
@Slf4j
@Component
public class OrderKafkaConsumer {

    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    public OrderKafkaConsumer(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // ── Listener 1: payment-completed → PAYMENT_CONFIRMED ───────────────────
    @KafkaListener(topics = "payment-completed", groupId = "order-group")
    @Transactional
    public void handlePaymentCompleted(String message) {
        try {
            PaymentCompletedEvent event = objectMapper.readValue(message, PaymentCompletedEvent.class);
            log.info("[Order] payment-completed received for orderId: {}, status: {}",
                    event.getOrderId(), event.getStatus());

            if (!"SUCCESS".equals(event.getStatus())) {
                log.warn("[Order] Payment status is '{}' for orderId: {}. Not updating order status.",
                        event.getStatus(), event.getOrderId());
                return;
            }

            Optional<Order> optionalOrder = orderRepository.findById(event.getOrderId());
            if (optionalOrder.isEmpty()) {
                log.warn("[Order] Order not found for orderId: {}. Skipping status update.", event.getOrderId());
                return;
            }

            Order order = optionalOrder.get();

            // Guard: only transition from PENDING_PAYMENT → PAYMENT_CONFIRMED
            if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
                log.warn("[Order] orderId: {} is in status: {} (not PENDING_PAYMENT). Skipping update.",
                        event.getOrderId(), order.getStatus());
                return;
            }

            order.setStatus(OrderStatus.PAYMENT_CONFIRMED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            log.info("[Order] orderId: {} transitioned PENDING_PAYMENT → PAYMENT_CONFIRMED", event.getOrderId());

        } catch (Exception e) {
            log.error("[Order] Failed to process payment-completed event: {}", e.getMessage(), e);
        }
    }

    // ── Listener 2: delivery-status → map to order status ───────────────────
    @KafkaListener(topics = "delivery-status", groupId = "order-group")
    @Transactional
    public void handleDeliveryStatus(String message) {
        try {
            DeliveryStatusEvent event = objectMapper.readValue(message, DeliveryStatusEvent.class);
            log.info("[Order] delivery-status received for orderId: {}, deliveryStatus: {}",
                    event.getOrderId(), event.getStatus());

            OrderStatus newOrderStatus = mapDeliveryStatusToOrderStatus(event.getStatus());
            if (newOrderStatus == null) {
                log.info("[Order] Delivery status '{}' for orderId: {} has no order-level mapping. Ignoring.",
                        event.getStatus(), event.getOrderId());
                return;
            }

            Optional<Order> optionalOrder = orderRepository.findById(event.getOrderId());
            if (optionalOrder.isEmpty()) {
                log.warn("[Order] Order not found for orderId: {}. Skipping delivery status sync.", event.getOrderId());
                return;
            }

            Order order = optionalOrder.get();
            OrderStatus oldStatus = order.getStatus();
            order.setStatus(newOrderStatus);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            log.info("[Order] orderId: {} status updated: {} → {} (delivery: {})",
                    event.getOrderId(), oldStatus, newOrderStatus, event.getStatus());

        } catch (Exception e) {
            log.error("[Order] Failed to process delivery-status event: {}", e.getMessage(), e);
        }
    }

    /**
     * Maps Delivery Service DeliveryStatus values to Order Service OrderStatus.
     *
     * Delivery Status   → Order Status
     * ─────────────────────────────────
     * ASSIGNED          → (no change, already PAYMENT_CONFIRMED)
     * PICKED_UP         → SHIPPED
     * OUT_FOR_DELIVERY  → OUT_FOR_DELIVERY
     * DELIVERED         → DELIVERED
     * FAILED            → CANCELLED
     *
     * @return mapped OrderStatus, or null if no mapping needed (e.g. ASSIGNED)
     */
    private OrderStatus mapDeliveryStatusToOrderStatus(String deliveryStatus) {
        return switch (deliveryStatus) {
            case "ASSIGNED"         -> null; // no order-level change needed
            case "PICKED_UP"        -> OrderStatus.SHIPPED;
            case "OUT_FOR_DELIVERY" -> OrderStatus.OUT_FOR_DELIVERY;
            case "DELIVERED"        -> OrderStatus.DELIVERED;
            case "FAILED"           -> OrderStatus.CANCELLED;
            default -> {
                log.warn("[Order] Unknown delivery status: '{}'", deliveryStatus);
                yield null;
            }
        };
    }
}
