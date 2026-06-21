package com.ordereasy.cart_service.repository;

import com.ordereasy.cart_service.entity.Cart;
import com.ordereasy.cart_service.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for {@link CartItem} — operates on the {@code cart_items} table.
 *
 * <p>Queries use the {@link Cart} entity reference (via the cart_id FK)
 * rather than userId directly, keeping the normalized model clean.
 */
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /**
     * Find a specific item within a cart by its product ID.
     * Used to check for duplicates before inserting a new cart item row.
     */
    Optional<CartItem> findByCartAndProductId(Cart cart, Long productId);

    /**
     * Delete a specific item from a cart by its product ID.
     * Used by the remove-item endpoint.
     */
    void deleteByCartAndProductId(Cart cart, Long productId);
}
