package com.ordereasy.payment_service.dto;

import lombok.Data;
import java.util.List;

/**
 * Manual payment initiation request (called via REST POST /payments/pay/{orderId}).
 *
 * Unlike the Kafka-driven flow (order-created → processPayment), this REST path
 * receives a PaymentRequest directly from the client. It must carry enough context
 * to publish a complete payment-completed event — specifically:
 *   - items (productId + quantity): so Inventory Service can finalize stock.
 *   - darkStoreId: so Inventory Service knows which dark store to deduct from.
 *   - deliverySlot: so Delivery Service can schedule correctly.
 *
 * Without these fields, the payment-completed event will be missing items/darkStoreId,
 * and Inventory Service will drop it (items-empty guard), leaving reservedQuantity stuck.
 */
@Data
public class PaymentRequest {
    private Long orderId;
    private Long userId;
    private String userEmail;
    private Double amount;

    // ── Required for complete payment-completed event ──────────────────────
    /** Order items (productId + quantity). Required for stock finalization. */
    private List<OrderItemEvent> items;

    /**
     * The dark store that fulfilled this order.
     * Must match the darkStoreId stored in the Order table.
     * Required so Inventory Service finalizes stock at (darkStoreId + productId).
     */
    private Long darkStoreId;

    /** Delivery slot. Propagated to payment-completed for Delivery Service. */
    private String deliverySlot;

    /** Delivery coordinates — used by Delivery Service for drop-off routing. */
    private Double deliveryLatitude;
    private Double deliveryLongitude;
}