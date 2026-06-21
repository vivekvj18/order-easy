package com.ordereasy.inventory_service.service.impl;

import com.ordereasy.inventory_service.dto.AddStockRequest;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.dto.StockReservationRequest;
import com.ordereasy.inventory_service.dto.StockReservationResponse;
import com.ordereasy.inventory_service.dto.StockResponse;
import com.ordereasy.inventory_service.entity.FinalizedOrder;
import com.ordereasy.inventory_service.entity.Stock;
import com.ordereasy.inventory_service.event.OrderItemEvent;
import com.ordereasy.inventory_service.exception.InsufficientStockException;
import com.ordereasy.inventory_service.exception.StockNotFoundException;
import com.ordereasy.inventory_service.repository.FinalizedOrderRepository;
import com.ordereasy.inventory_service.repository.StockRepository;
import com.ordereasy.inventory_service.service.StockService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private static final Logger log = LoggerFactory.getLogger(StockServiceImpl.class);

    private final StockRepository stockRepository;
    private final FinalizedOrderRepository finalizedOrderRepository;

    @Override
    public StockResponse getStock(Long productId) {
        Stock stock = stockRepository.findByProductId(productId)
                .orElseThrow(() -> new StockNotFoundException("Stock not found for product id: " + productId));
        return mapToResponse(stock);
    }

    @Override
    public StockResponse addStock(Long productId, AddStockRequest request) {
        Stock stock = stockRepository.findByProductId(productId)
                .orElse(Stock.builder()
                        .productId(productId)
                        .quantity(0)
                        .reservedQuantity(0)
                        .build());

        stock.setQuantity(stock.getQuantity() + request.getQuantity());
        stock.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(stockRepository.save(stock));
    }

    @Override
    public StockResponse reserveStock(ReserveStockRequest request) {
        Stock stock = stockRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new StockNotFoundException("Stock not found for product id: " + request.getProductId()));

        int available = stock.getQuantity() - stock.getReservedQuantity();

        if (available < request.getQuantity()) {
            throw new InsufficientStockException("Insufficient stock. Available: " + available);
        }

        stock.setReservedQuantity(stock.getReservedQuantity() + request.getQuantity());
        stock.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(stockRepository.save(stock));
    }

    @Override
    public StockResponse releaseStock(ReserveStockRequest request) {
        Stock stock = stockRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new StockNotFoundException(
                        "Stock not found for product id: " + request.getProductId()));

        int currentReserved = stock.getReservedQuantity();
        int toRelease = request.getQuantity();

        if (currentReserved <= 0) {
            // Already fully released (idempotent no-op)
            log.warn("[Stock] releaseStock called for productId={} but reservedQuantity is already {}. " +
                    "Skipping (idempotent no-op).", request.getProductId(), currentReserved);
            return mapToResponse(stock);
        }

        // Clamp release to current reserved — prevents negative reservedQuantity
        // on duplicate events or race conditions
        int actualRelease = Math.min(toRelease, currentReserved);
        if (actualRelease < toRelease) {
            log.warn("[Stock] productId={}: requested release={} but only {} reserved. " +
                    "Releasing {} (clamped to prevent negative).",
                    request.getProductId(), toRelease, currentReserved, actualRelease);
        }

        stock.setReservedQuantity(currentReserved - actualRelease);
        stock.setUpdatedAt(LocalDateTime.now());
        log.info("[Stock] productId={}: reservedQuantity {} → {}",
                request.getProductId(), currentReserved, stock.getReservedQuantity());

        return mapToResponse(stockRepository.save(stock));
    }

    @Override
    @Transactional
    public StockReservationResponse reserveStockBulk(StockReservationRequest request) {
        // Phase 1 — validate ALL items before deducting anything (atomic check)
        for (StockReservationRequest.StockItem item : request.getItems()) {
            Stock stock = stockRepository.findByProductId(item.getProductId())
                    .orElseThrow(() -> new StockNotFoundException(
                            "Stock not found for product id: " + item.getProductId()));

            int available = stock.getQuantity() - stock.getReservedQuantity();

            if (available < item.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for product id: " + item.getProductId() +
                        ". Available: " + available +
                        ", Requested: " + item.getQuantity());
            }
        }

        // Phase 2 — all validated, now deduct by incrementing reservedQuantity
        for (StockReservationRequest.StockItem item : request.getItems()) {
            Stock stock = stockRepository.findByProductId(item.getProductId()).get();
            stock.setReservedQuantity(stock.getReservedQuantity() + item.getQuantity());
            stock.setUpdatedAt(LocalDateTime.now());
            stockRepository.save(stock);
        }

        return StockReservationResponse.builder()
                .success(true)
                .message("Stock reserved successfully")
                .build();
    }

    /**
     * Finalizes reserved stock after a successful payment.
     *
     * Flow per item:
     *   quantity         = quantity         - orderedQty   (e.g. 50 → 48)
     *   reservedQuantity = reservedQuantity - orderedQty   (e.g.  2 →  0)
     *
     * Idempotency: if a FinalizedOrder row already exists for this orderId,
     * the event is a duplicate and we return immediately without touching stock.
     */
    @Override
    @Transactional
    public void finalizeReservedStock(Long orderId, List<OrderItemEvent> items) {
        log.info("[Stock Finalization] Received finalize request for orderId: {}", orderId);

        // ── Idempotency check (application-level fast path) ──────────────────
        if (finalizedOrderRepository.existsByOrderId(orderId)) {
            log.warn("[Stock Finalization] Duplicate event detected for orderId: {}. " +
                     "Stock already finalized — skipping.", orderId);
            return;
        }

        // ── Phase 1: Validate ALL items before touching anything ─────────────
        for (OrderItemEvent item : items) {
            Stock stock = stockRepository.findByProductId(item.getProductId())
                    .orElseThrow(() -> new StockNotFoundException(
                            "Stock not found for productId: " + item.getProductId()));

            if (stock.getReservedQuantity() < item.getQuantity()) {
                throw new InsufficientStockException(
                        "Cannot finalize: reservedQuantity (" + stock.getReservedQuantity() +
                        ") is less than ordered quantity (" + item.getQuantity() +
                        ") for productId: " + item.getProductId());
            }
        }

        // ── Phase 2: All validated — apply deductions ────────────────────────
        for (OrderItemEvent item : items) {
            Stock stock = stockRepository.findByProductId(item.getProductId()).get();

            int oldQty      = stock.getQuantity();
            int oldReserved = stock.getReservedQuantity();
            int deduct      = item.getQuantity();

            stock.setQuantity(oldQty - deduct);
            stock.setReservedQuantity(oldReserved - deduct);
            stock.setUpdatedAt(LocalDateTime.now());
            stockRepository.save(stock);

            log.info("[Stock Finalization] productId={} | quantity: {} → {} | reservedQuantity: {} → {}",
                    item.getProductId(),
                    oldQty,      stock.getQuantity(),
                    oldReserved, stock.getReservedQuantity());
        }

        // ── Phase 3: Mark this orderId as finalized (idempotency commit) ─────
        finalizedOrderRepository.save(
                FinalizedOrder.builder()
                        .orderId(orderId)
                        .finalizedAt(LocalDateTime.now())
                        .build()
        );

        log.info("[Stock Finalization] Successfully finalized stock for orderId: {}", orderId);
    }

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