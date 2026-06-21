package com.ordereasy.cart_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a shopping cart belonging to a single user.
 *
 * <p>Design rules:
 * <ul>
 *   <li>One active cart per user — enforced by UNIQUE constraint on {@code user_id}.</li>
 *   <li>Cart items are owned by this cart via {@code @OneToMany} with cascade and orphanRemoval,
 *       so clearing {@code items} and saving the cart automatically deletes orphaned rows.</li>
 * </ul>
 */
@Entity
@Table(name = "carts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_carts_user_id", columnNames = {"user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Trusted user identity — injected by API Gateway via X-User-Id header. Never from request body. */
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * All items belonging to this cart.
     *
     * <p>{@code cascade = ALL} — saves/deletes items along with the cart.<br>
     * {@code orphanRemoval = true} — removing an item from this list deletes the row from DB.
     */
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();
}
