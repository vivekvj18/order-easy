package com.ordereasy.payment_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
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
}
