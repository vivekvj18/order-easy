package com.ordereasy.inventory_service.repository;

import com.ordereasy.inventory_service.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Stock entity.
 *
 * All lookups are now at (darkStoreId + productId) level — NOT global productId.
 *
 * Interview note:
 *   - findByDarkStoreIdAndProductId: used during reservation Phase 1 + Phase 2.
 *   - findByDarkStoreIdAndProductIdIn: batch fetch for multi-item cart validation.
 *   - The old findByProductId is removed to enforce dark-store-aware stock access.
 */
public interface StockRepository extends JpaRepository<Stock, Long> {

    /**
     * Fetch stock for a specific product in a specific dark store.
     * Used during single-item operations and reservation phases.
     */
    Optional<Stock> findByDarkStoreIdAndProductId(Long darkStoreId, Long productId);

    /**
     * Batch fetch stock for a list of products in a specific dark store.
     * Used to check if a dark store can fulfill the complete cart.
     */
    List<Stock> findByDarkStoreIdAndProductIdIn(Long darkStoreId, List<Long> productIds);
}
