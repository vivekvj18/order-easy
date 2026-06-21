package com.ordereasy.cart_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents a single line item inside a {@link Cart}.
 *
 * <p>Design rules:
 * <ul>
 *   <li>References its parent cart via a {@code cart_id} FK — userId is no longer stored here.</li>
 *   <li>A UNIQUE constraint on {@code (cart_id, product_id)} prevents the same product from
 *       appearing twice in the same cart at the DB level.</li>
 * </ul>
 */
@Entity
@Table(
        name = "cart_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_cart_items_cart_product", columnNames = {"cart_id", "product_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * FK to the owning cart. {@code nullable = false} — every item must belong to a cart.
     * {@code FetchType.LAZY} avoids loading the full Cart when only item data is needed.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
