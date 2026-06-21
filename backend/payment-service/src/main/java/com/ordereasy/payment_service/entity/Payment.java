package com.ordereasy.payment_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "payments",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_payment_idempotency_key",
                columnNames = "idempotency_key"
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    private Long userId;

    private Double amount;

    private String status; // PENDING, SUCCESS, FAILED

    private String transactionId;

    private LocalDateTime createdAt;

    /**
     * Client-supplied idempotency key (UUID recommended).
     * Nullable — Kafka-driven internal payments do not carry a key.
     * A unique constraint prevents duplicate rows for the same client key.
     */
    @Column(name = "idempotency_key", nullable = true)
    private String idempotencyKey;
}
