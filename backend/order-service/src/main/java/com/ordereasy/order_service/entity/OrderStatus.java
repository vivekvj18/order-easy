package com.ordereasy.order_service.entity;

public enum OrderStatus {
    /** Order created, stock reserved, awaiting payment. */
    PENDING_PAYMENT,
    /** Payment completed successfully. */
    PAYMENT_CONFIRMED,
    /** Legacy / manually confirmed orders. */
    CONFIRMED,
    SHIPPED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,
    /** Order expired due to payment timeout. */
    EXPIRED
}
