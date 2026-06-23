package com.ordereasy.inventory_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents per-dark-store stock for a product.
 *
 * Stock is now tracked at the (dark_store_id, product_id) level — not globally.
 * This allows each dark store to hold independent inventory for the same product.
 *
 * Unique constraint: (dark_store_id, product_id) — one row per store per product.
 *
 * Interview note:
 *   - reservedQuantity is incremented during checkout (Phase 2 reservation).
 *   - quantity is decremented only after payment-completed (finalization).
 *   - availableStock = quantity - reservedQuantity.
 *   - @Version enables optimistic locking to prevent concurrent reservation conflicts.
 */
@Entity
@Table(
    name = "stock",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_stock_dark_store_product",
        columnNames = {"dark_store_id", "product_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The dark store this stock row belongs to.
     * Many stock rows → one dark store.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dark_store_id", nullable = false)
    private DarkStore darkStore;

    /** Product ID from the global Product Service catalog. Not duplicated here. */
    @Column(name = "product_id", nullable = false)
    private Long productId;

    /** Physical quantity available in this dark store. */
    private Integer quantity;

    /** Quantity reserved (committed to pending orders) but not yet physically deducted. */
    private Integer reservedQuantity;

    private LocalDateTime updatedAt;

    /** Optimistic locking to handle concurrent reservation requests safely. */
    @Version
    private Long version;
}