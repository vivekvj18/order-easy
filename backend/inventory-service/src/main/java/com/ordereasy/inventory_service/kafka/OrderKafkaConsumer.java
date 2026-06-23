package com.ordereasy.inventory_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ordereasy.inventory_service.event.OrderCancelledEvent;
import com.ordereasy.inventory_service.event.PaymentCompletedEvent;
import com.ordereasy.inventory_service.service.StockService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for inventory-related events.
 *
 * Listeners:
 *  - order-cancelled    → releases reserved stock in the selected dark store
 *  - payment-completed  → finalizes stock in the selected dark store (deducts quantity)
 *
 * NOTE: order-created stock reservation was moved to synchronous Feign (Order Service
 * calls Inventory Service before saving the order). That listener no longer exists here.
 *
 * Dark store note:
 *   Both events now carry darkStoreId so that stock operations are scoped to the
 *   correct (darkStoreId + productId) row — not a global productId row.
 */
@Component
public class OrderKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderKafkaConsumer.class);

    private final StockService stockService;
    private final ObjectMapper objectMapper;

    public OrderKafkaConsumer(StockService stockService) {
        this.stockService = stockService;
        // Register JavaTimeModule so LocalDateTime inside events deserializes correctly
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // ── Listener 1: Release reserved stock when an order is cancelled ────────
    @KafkaListener(topics = "order-cancelled", groupId = "inventory-group")
    public void handleOrderCancelled(String message) {
        try {
            OrderCancelledEvent event = objectMapper.readValue(message, OrderCancelledEvent.class);
            log.info("[Inventory] order-cancelled event received for orderId={}, darkStoreId={}",
                    event.getOrderId(), event.getDarkStoreId());

            if (event.getDarkStoreId() == null) {
                log.warn("[Inventory] order-cancelled event for orderId={} has no darkStoreId. " +
                         "Cannot release stock — dark store context missing.", event.getOrderId());
                return;
            }

            if (event.getItems() == null || event.getItems().isEmpty()) {
                log.warn("[Inventory] order-cancelled event for orderId={} has no items. Skipping.", event.getOrderId());
                return;
            }

            stockService.releaseReservedStockForOrder(event.getDarkStoreId(), event.getItems());
            log.info("[Inventory] Released stock for orderId={} in darkStoreId={}",
                    event.getOrderId(), event.getDarkStoreId());

        } catch (Exception e) {
            log.error("[Inventory] Failed to process order-cancelled event: {}", e.getMessage(), e);
        }
    }

    // ── Listener 2: Finalize stock after successful payment ──────────────────
    @KafkaListener(topics = "payment-completed", groupId = "inventory-group")
    public void handlePaymentCompleted(String message) {
        try {
            PaymentCompletedEvent event = objectMapper.readValue(message, PaymentCompletedEvent.class);
            log.info("[Inventory] payment-completed event received for orderId={}, status={}, darkStoreId={}",
                    event.getOrderId(), event.getStatus(), event.getDarkStoreId());

            // Only finalize stock on payment SUCCESS
            if (!"SUCCESS".equals(event.getStatus())) {
                log.warn("[Inventory] Payment status is '{}' for orderId={}. Skipping stock finalization.",
                        event.getStatus(), event.getOrderId());
                return;
            }

            if (event.getItems() == null || event.getItems().isEmpty()) {
                log.warn("[Inventory] payment-completed event for orderId={} has no items. Skipping.", event.getOrderId());
                return;
            }

            if (event.getDarkStoreId() == null) {
                log.warn("[Inventory] payment-completed event for orderId={} has no darkStoreId. " +
                         "Cannot finalize stock — dark store context missing.", event.getOrderId());
                return;
            }

            log.info("[Inventory] Starting stock finalization for orderId={}, darkStoreId={}, {} item(s)",
                    event.getOrderId(), event.getDarkStoreId(), event.getItems().size());

            stockService.finalizeReservedStock(event.getOrderId(), event.getDarkStoreId(), event.getItems());

        } catch (Exception e) {
            log.error("[Inventory] Failed to process payment-completed event: {}", e.getMessage(), e);
        }
    }
}