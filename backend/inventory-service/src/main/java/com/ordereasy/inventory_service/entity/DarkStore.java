package com.ordereasy.inventory_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents a dark store (micro-fulfillment center) in the system.
 *
 * Dark stores are small, localized warehouses from which quick-commerce
 * orders are fulfilled. One order is fulfilled by exactly ONE dark store.
 *
 * Interview note:
 *   - Dark store selection (Phase 0) happens before stock reservation.
 *   - We find the nearest FULFILLABLE dark store using Haversine distance.
 *   - No Redis GEO is used; bounding-box pre-filter + Haversine sort is sufficient MVP.
 */
@Entity
@Table(name = "dark_stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DarkStore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    /** Only active stores are eligible for dark-store selection. */
    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
