package com.ordereasy.cart_service.repository;

import com.ordereasy.cart_service.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for {@link Cart} — operates on the {@code carts} table.
 *
 * <p>The primary lookup is by {@code userId} since each user has exactly one cart.
 * Cart item queries (find/delete by product) are handled by {@link CartItemRepository}.
 */
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    /**
     * Find the cart for a given user.
     * Returns empty if the user has never added anything to their cart.
     */
    Optional<Cart> findByUserId(Long userId);
}
