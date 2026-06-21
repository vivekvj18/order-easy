package com.ordereasy.inventory_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Idempotency guard for stock finalization.
 *
 * One row is inserted per orderId the first time a "payment-completed" event
 * is successfully processed.  The UNIQUE constraint on orderId ensures that a
 * duplicate Kafka delivery for the same orderId causes a constraint-violation
 * exception, which the consumer catches and uses to skip re-processing.
 */
@Entity
@Table(name = "finalized_orders",
       uniqueConstraints = @UniqueConstraint(name = "uq_finalized_order_id", columnNames = "order_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalizedOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "finalized_at", nullable = false)
    private LocalDateTime finalizedAt;
}
