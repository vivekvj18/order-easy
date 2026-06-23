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

    @Column(name = "delivery_latitude")
    private Double deliveryLatitude;

    @Column(name = "delivery_longitude")
    private Double deliveryLongitude;

    /**
     * Total pickup-aware route distance: riderToDarkStore + darkStoreToCustomer (km).
     * Populated by PickupAwareNearestPartnerStrategy.
     */
    @Column(name = "assignment_distance_km")
    private Double assignmentDistanceKm;

    // ── Dark store traceability ────────────────────────────────────────────
    /** ID of the dark store that fulfills this order (pickup point). */
    @Column(name = "dark_store_id")
    private Long darkStoreId;

    @Column(name = "dark_store_name")
    private String darkStoreName;

    /** Latitude of the dark store (pickup point). */
    @Column(name = "pickup_latitude")
    private Double pickupLatitude;

    /** Longitude of the dark store (pickup point). */
    @Column(name = "pickup_longitude")
    private Double pickupLongitude;
}
