package com.ordereasy.inventory_service.service.impl;

import com.ordereasy.inventory_service.dto.AddStockRequest;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.dto.StockReservationRequest;
import com.ordereasy.inventory_service.dto.StockReservationResponse;
import com.ordereasy.inventory_service.dto.StockResponse;
import com.ordereasy.inventory_service.entity.DarkStore;
import com.ordereasy.inventory_service.entity.FinalizedOrder;
import com.ordereasy.inventory_service.entity.Stock;
import com.ordereasy.inventory_service.event.OrderItemEvent;
import com.ordereasy.inventory_service.exception.InsufficientStockException;
import com.ordereasy.inventory_service.exception.StockNotFoundException;
import com.ordereasy.inventory_service.repository.DarkStoreRepository;
import com.ordereasy.inventory_service.repository.FinalizedOrderRepository;
import com.ordereasy.inventory_service.repository.StockRepository;
import com.ordereasy.inventory_service.service.StockService;
import com.ordereasy.inventory_service.util.BoundingBoxUtil;
import com.ordereasy.inventory_service.util.HaversineUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Core stock management service with dark-store-aware fulfillment.
 *
 * Dark Store Fulfillment Design (interview summary):
 * ─────────────────────────────────────────────────
 * Phase 0 — Dark Store Selection (NEW):
 *   1. Compute bounding box around user location using configurable radius (default 5 km).
 *   2. Query DB for active stores inside bounding box.
 *   3. Compute exact Haversine distance for each candidate.
 *   4. Sort by distance ascending (nearest first).
 *   5. For each store: check if ALL cart items can be fulfilled (availableStock ≥ requested).
 *   6. Select the FIRST (nearest) store that can fulfill the complete cart.
 *   7. If none found in 5 km, retry with fallback radius (10 km).
 *   8. If still none, reject checkout.
 *
 * Phase 1 — Validate (UNCHANGED conceptually):
 *   Fetch stock for each item in the selected dark store.
 *   Validate available = quantity - reservedQuantity ≥ requested.
 *   If any item fails, abort entire reservation (no partial order).
 *
 * Phase 2 — Reserve (UNCHANGED conceptually):
 *   Increment reservedQuantity for all validated items.
 *   All within @Transactional for atomicity.
 *
 * Finalization (after payment-completed):
 *   Decrement quantity AND reservedQuantity for each item in the selected dark store.
 *   Idempotency guard via finalized_orders table.
 *
 * Key constraints:
 *   - No partial order support (all-or-nothing per store).
 *   - One order → one dark store only.
 *   - Product catalog owned by Product Service (not duplicated here).
 */
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private static final Logger log = LoggerFactory.getLogger(StockServiceImpl.class);

    private final StockRepository stockRepository;
    private final DarkStoreRepository darkStoreRepository;
    private final FinalizedOrderRepository finalizedOrderRepository;

    /** Primary search radius for dark store selection (default: 5 km). */
    @Value("${darkstore.search.radius.km:5.0}")
    private double searchRadiusKm;

    /** Fallback radius when no store found within primary radius (default: 10 km). */
    @Value("${darkstore.search.fallback.radius.km:10.0}")
    private double fallbackRadiusKm;

    // ─────────────────────────────────────────────────────────────────────────
    // Single-item operations (admin / internal use)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public StockResponse getStock(Long darkStoreId, Long productId) {
        Stock stock = stockRepository.findByDarkStoreIdAndProductId(darkStoreId, productId)
                .orElseThrow(() -> new StockNotFoundException(
                        "Stock not found for darkStoreId: " + darkStoreId + ", productId: " + productId));
        return mapToResponse(stock);
    }

    @Override
    public StockResponse addStock(Long darkStoreId, Long productId, AddStockRequest request) {
        DarkStore darkStore = darkStoreRepository.findById(darkStoreId)
                .orElseThrow(() -> new StockNotFoundException("Dark store not found: " + darkStoreId));

        Stock stock = stockRepository.findByDarkStoreIdAndProductId(darkStoreId, productId)
                .orElse(Stock.builder()
                        .darkStore(darkStore)
                        .productId(productId)
                        .quantity(0)
                        .reservedQuantity(0)
                        .build());

        stock.setQuantity(stock.getQuantity() + request.getQuantity());
        stock.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(stockRepository.save(stock));
    }

    @Override
    public StockResponse reserveStock(Long darkStoreId, ReserveStockRequest request) {
        Stock stock = stockRepository.findByDarkStoreIdAndProductId(darkStoreId, request.getProductId())
                .orElseThrow(() -> new StockNotFoundException(
                        "Stock not found for darkStoreId: " + darkStoreId + ", productId: " + request.getProductId()));

        int available = stock.getQuantity() - stock.getReservedQuantity();
        if (available < request.getQuantity()) {
            throw new InsufficientStockException("Insufficient stock. Available: " + available);
        }

        stock.setReservedQuantity(stock.getReservedQuantity() + request.getQuantity());
        stock.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(stockRepository.save(stock));
    }

    @Override
    public StockResponse releaseStock(Long darkStoreId, ReserveStockRequest request) {
        Stock stock = stockRepository.findByDarkStoreIdAndProductId(darkStoreId, request.getProductId())
                .orElseThrow(() -> new StockNotFoundException(
                        "Stock not found for darkStoreId: " + darkStoreId + ", productId: " + request.getProductId()));

        int currentReserved = stock.getReservedQuantity();
        int toRelease = request.getQuantity();

        if (currentReserved <= 0) {
            log.warn("[Stock] releaseStock called for darkStoreId={}, productId={} but reservedQty is already {}. " +
                    "Skipping (idempotent no-op).", darkStoreId, request.getProductId(), currentReserved);
            return mapToResponse(stock);
        }

        int actualRelease = Math.min(toRelease, currentReserved);
        if (actualRelease < toRelease) {
            log.warn("[Stock] darkStoreId={}, productId={}: requested release={} but only {} reserved. " +
                    "Releasing {} (clamped).", darkStoreId, request.getProductId(), toRelease, currentReserved, actualRelease);
        }

        stock.setReservedQuantity(currentReserved - actualRelease);
        stock.setUpdatedAt(LocalDateTime.now());
        log.info("[Stock] darkStoreId={}, productId={}: reservedQty {} → {}",
                darkStoreId, request.getProductId(), currentReserved, stock.getReservedQuantity());

        return mapToResponse(stockRepository.save(stock));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Bulk reservation with dark store selection (checkout path)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Main checkout entry point.
     *
     * Phase 0: Select nearest fulfillable dark store.
     * Phase 1 + Phase 2: Two-phase reservation in selected store.
     *
     * Interview note:
     *   "Nearest dark store" means nearest FULFILLABLE dark store.
     *   We never partially split an order across stores.
     */
    @Override
    @Transactional
    public StockReservationResponse reserveStockBulk(StockReservationRequest request) {
        Double userLat = request.getUserLatitude();
        Double userLon = request.getUserLongitude();

        if (userLat == null || userLon == null) {
            return StockReservationResponse.builder()
                    .success(false)
                    .message("User location (userLatitude, userLongitude) is required for dark store selection")
                    .build();
        }

        // ── Phase 0: Dark store selection ─────────────────────────────────────
        DarkStore selectedStore = selectNearestFulfillableStore(userLat, userLon, request.getItems());

        if (selectedStore == null) {
            log.warn("[DarkStore] No nearby dark store can fulfill the complete cart for user at ({}, {})",
                    userLat, userLon);
            return StockReservationResponse.builder()
                    .success(false)
                    .message("No nearby dark store can fulfill the complete cart")
                    .build();
        }

        log.info("[DarkStore] Selected store: id={}, name='{}' for order fulfillment",
                selectedStore.getId(), selectedStore.getName());

        // ── Phase 1: Validate ALL items in selected dark store ────────────────
        for (StockReservationRequest.StockItem item : request.getItems()) {
            Stock stock = stockRepository
                    .findByDarkStoreIdAndProductId(selectedStore.getId(), item.getProductId())
                    .orElseThrow(() -> new StockNotFoundException(
                            "Stock not found in dark store '" + selectedStore.getName() +
                            "' for productId: " + item.getProductId()));

            int available = stock.getQuantity() - stock.getReservedQuantity();
            if (available < item.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock in dark store '" + selectedStore.getName() +
                        "' for productId: " + item.getProductId() +
                        ". Available: " + available + ", Requested: " + item.getQuantity());
            }
        }

        // ── Phase 2: All validated — increment reservedQuantity ───────────────
        for (StockReservationRequest.StockItem item : request.getItems()) {
            Stock stock = stockRepository
                    .findByDarkStoreIdAndProductId(selectedStore.getId(), item.getProductId()).get();
            stock.setReservedQuantity(stock.getReservedQuantity() + item.getQuantity());
            stock.setUpdatedAt(LocalDateTime.now());
            stockRepository.save(stock);
            log.info("[Reservation] darkStore={}, productId={}: reservedQty incremented by {}",
                    selectedStore.getName(), item.getProductId(), item.getQuantity());
        }

        return StockReservationResponse.builder()
                .success(true)
                .message("Stock reserved successfully")
                .darkStoreId(selectedStore.getId())
                .darkStoreName(selectedStore.getName())
                .darkStoreLatitude(selectedStore.getLatitude())
                .darkStoreLongitude(selectedStore.getLongitude())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Dark Store Selection Logic
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Finds the nearest dark store that can fulfill ALL requested cart items.
     *
     * Algorithm:
     *   1. Compute bounding box with primary radius.
     *   2. If no stores in box, retry with fallback radius.
     *   3. Compute Haversine distance for each candidate.
     *   4. Sort by distance ascending.
     *   5. Return first store where canFulfillCompleteCart() == true.
     *
     * @return nearest fulfillable DarkStore, or null if none found
     */
    private DarkStore selectNearestFulfillableStore(
            double userLat, double userLon,
            List<StockReservationRequest.StockItem> items) {

        // Try primary radius, then fallback radius
        List<DarkStore> candidates = findCandidatesWithinRadius(userLat, userLon, searchRadiusKm);

        if (candidates.isEmpty()) {
            log.info("[DarkStore] No stores within {}km. Retrying with fallback {}km.",
                    searchRadiusKm, fallbackRadiusKm);
            candidates = findCandidatesWithinRadius(userLat, userLon, fallbackRadiusKm);
        }

        if (candidates.isEmpty()) {
            log.warn("[DarkStore] No active dark stores found within {}km of ({}, {})",
                    fallbackRadiusKm, userLat, userLon);
            return null;
        }

        // Sort by Haversine distance (nearest first)
        List<DarkStore> sorted = candidates.stream()
                .sorted(Comparator.comparingDouble(store ->
                        HaversineUtil.calculateDistanceKm(userLat, userLon,
                                store.getLatitude(), store.getLongitude())))
                .collect(Collectors.toList());

        // Find nearest FULFILLABLE store
        for (DarkStore store : sorted) {
            double dist = HaversineUtil.calculateDistanceKm(
                    userLat, userLon, store.getLatitude(), store.getLongitude());
            log.info("[DarkStore] Checking store: id={}, name='{}', distance={}km",
                    store.getId(), store.getName(), String.format("%.2f", dist));

            if (canFulfillCompleteCart(store.getId(), items)) {
                log.info("[DarkStore] Store '{}' ({}km) can fulfill complete cart. Selected.",
                        store.getName(), String.format("%.2f", dist));
                return store;
            } else {
                log.info("[DarkStore] Store '{}' cannot fulfill complete cart. Skipping to next.",
                        store.getName());
            }
        }

        return null; // no fulfillable store found
    }

    /**
     * Uses bounding-box filtering to get a cheap candidate set from the DB.
     */
    private List<DarkStore> findCandidatesWithinRadius(double userLat, double userLon, double radiusKm) {
        double[] box = BoundingBoxUtil.calculate(userLat, userLon, radiusKm);
        // box = { minLat, maxLat, minLng, maxLng }
        return darkStoreRepository.findByActiveTrueAndLatitudeBetweenAndLongitudeBetween(
                box[0], box[1], box[2], box[3]);
    }

    /**
     * Checks if a specific dark store can fulfill ALL items in the cart.
     *
     * availableStock = quantity - reservedQuantity
     *
     * Interview note:
     *   No partial fulfillment. If any single item is unavailable in this store,
     *   the store is rejected and the next nearest store is tried.
     */
    private boolean canFulfillCompleteCart(Long darkStoreId,
                                            List<StockReservationRequest.StockItem> items) {
        List<Long> productIds = items.stream()
                .map(StockReservationRequest.StockItem::getProductId)
                .collect(Collectors.toList());

        List<Stock> stockList = stockRepository.findByDarkStoreIdAndProductIdIn(darkStoreId, productIds);

        // Must have stock rows for ALL requested products
        if (stockList.size() < items.size()) {
            return false;
        }

        Map<Long, Stock> stockMap = stockList.stream()
                .collect(Collectors.toMap(Stock::getProductId, s -> s));

        for (StockReservationRequest.StockItem item : items) {
            Stock stock = stockMap.get(item.getProductId());
            if (stock == null) return false;

            int available = stock.getQuantity() - stock.getReservedQuantity();
            if (available < item.getQuantity()) {
                log.debug("[DarkStore] darkStoreId={}: productId={} insufficient. Available={}, Requested={}",
                        darkStoreId, item.getProductId(), available, item.getQuantity());
                return false;
            }
        }

        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Stock finalization after payment-completed
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Finalizes reserved stock after a successful payment.
     *
     * Flow per item:
     *   quantity         = quantity         - orderedQty  (physical deduction)
     *   reservedQuantity = reservedQuantity - orderedQty  (release reservation)
     *
     * Idempotency: if a FinalizedOrder row already exists for this orderId,
     * the event is a duplicate — skip entirely without touching stock.
     *
     * Interview note:
     *   darkStoreId is now required for stock finalization because stock is at
     *   (darkStoreId + productId) level, not global productId level.
     */
    @Override
    @Transactional
    public void finalizeReservedStock(Long orderId, Long darkStoreId, List<OrderItemEvent> items) {
        log.info("[Stock Finalization] orderId={}, darkStoreId={}", orderId, darkStoreId);

        // ── Idempotency check ────────────────────────────────────────────────
        if (finalizedOrderRepository.existsByOrderId(orderId)) {
            log.warn("[Stock Finalization] Duplicate event for orderId={}. Already finalized — skipping.", orderId);
            return;
        }

        // ── Phase 1: Validate ALL items before touching anything ─────────────
        for (OrderItemEvent item : items) {
            Stock stock = stockRepository
                    .findByDarkStoreIdAndProductId(darkStoreId, item.getProductId())
                    .orElseThrow(() -> new StockNotFoundException(
                            "Stock not found in darkStoreId=" + darkStoreId + " for productId=" + item.getProductId()));

            if (stock.getReservedQuantity() < item.getQuantity()) {
                throw new InsufficientStockException(
                        "Cannot finalize: reservedQty (" + stock.getReservedQuantity() +
                        ") < orderedQty (" + item.getQuantity() + ") for productId=" + item.getProductId() +
                        " in darkStoreId=" + darkStoreId);
            }
        }

        // ── Phase 2: Apply deductions ────────────────────────────────────────
        for (OrderItemEvent item : items) {
            Stock stock = stockRepository
                    .findByDarkStoreIdAndProductId(darkStoreId, item.getProductId()).get();

            int oldQty      = stock.getQuantity();
            int oldReserved = stock.getReservedQuantity();
            int deduct      = item.getQuantity();

            stock.setQuantity(oldQty - deduct);
            stock.setReservedQuantity(oldReserved - deduct);
            stock.setUpdatedAt(LocalDateTime.now());
            stockRepository.save(stock);

            log.info("[Stock Finalization] darkStore={}, productId={} | qty: {} → {} | reserved: {} → {}",
                    darkStoreId, item.getProductId(), oldQty, stock.getQuantity(), oldReserved, stock.getReservedQuantity());
        }

        // ── Phase 3: Mark orderId as finalized (idempotency commit) ──────────
        finalizedOrderRepository.save(
                FinalizedOrder.builder()
                        .orderId(orderId)
                        .finalizedAt(LocalDateTime.now())
                        .build()
        );

        log.info("[Stock Finalization] Successfully finalized stock for orderId={} in darkStoreId={}", orderId, darkStoreId);
    }

    /**
     * Releases all reserved stock for a cancelled order.
     * Used by OrderKafkaConsumer when order-cancelled event is received.
     */
    @Override
    @Transactional
    public void releaseReservedStockForOrder(Long darkStoreId, List<OrderItemEvent> items) {
        for (OrderItemEvent item : items) {
            stockRepository.findByDarkStoreIdAndProductId(darkStoreId, item.getProductId())
                    .ifPresent(stock -> {
                        int currentReserved = stock.getReservedQuantity();
                        if (currentReserved <= 0) {
                            log.warn("[Stock Release] darkStore={}, productId={}: reservedQty already 0. Skipping.",
                                    darkStoreId, item.getProductId());
                            return;
                        }
                        int actualRelease = Math.min(item.getQuantity(), currentReserved);
                        stock.setReservedQuantity(currentReserved - actualRelease);
                        stock.setUpdatedAt(LocalDateTime.now());
                        stockRepository.save(stock);
                        log.info("[Stock Release] darkStore={}, productId={}: reservedQty {} → {}",
                                darkStoreId, item.getProductId(), currentReserved, stock.getReservedQuantity());
                    });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private StockResponse mapToResponse(Stock stock) {
        int available = stock.getQuantity() - stock.getReservedQuantity();
        return StockResponse.builder()
                .productId(stock.getProductId())
                .quantity(stock.getQuantity())
                .reservedQuantity(stock.getReservedQuantity())
                .availableQuantity(available)
                .build();
    }
}