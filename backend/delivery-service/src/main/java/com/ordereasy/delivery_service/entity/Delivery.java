package com.ordereasy.delivery_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Order Service ka orderId (foreign key nahi, sirf reference)
    @Column(nullable = false)
    private Long orderId;

    // Delivery Partner mapping
    @ManyToOne
    @JoinColumn(name = "partner_id", nullable = false)
    private DeliveryPartner partner;

    // Delivery status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status;

    // Kab assign hua
    private LocalDateTime assignedAt;

    // Last update kab hua
    private LocalDateTime updatedAt;
}