package com.ordereasy.cart_service.controller;

import com.ordereasy.cart_service.dto.CartItemRequest;
import com.ordereasy.cart_service.dto.CartResponse;
import com.ordereasy.cart_service.exception.AccessDeniedException;
import com.ordereasy.cart_service.exception.UnauthorizedException;
import com.ordereasy.cart_service.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /** Shared secret — read from INTERNAL_SECRET env var via application.properties. */
    @Value("${internal.service.secret}")
    private String internalSecret;

    // ── Auth helpers ──────────────────────────────────────────────────────────

    private Long parseUserId(String header) {
        if (header == null || header.isBlank()) return null;
        try { return Long.parseLong(header.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    /**
     * Two-tier trust model:
     *
     * Tier 1 — Internal service call:
     *   X-Internal-Service matches the shared secret → allow unconditionally.
     *   (Used by Order Service Feign calls. Gateway always strips this header from external requests.)
     *
     * Tier 2 — Authenticated user via Gateway:
     *   X-User-Role + X-User-Id must be present (injected by Gateway after JWT validation).
     *   ADMIN  → unrestricted access.
     *   CUSTOMER → allowed only if resourceUserId == X-User-Id (own cart).
     *   Missing headers → 401 Unauthorized.
     *   Wrong userId   → 403 Forbidden.
     */
    private void enforceCartAccess(Long resourceUserId, HttpServletRequest req) {
        // Tier 1: valid internal service call — Gateway has already stripped this header
        // from any external request, so it can only arrive from trusted Feign clients.
        String incomingInternal = req.getHeader("X-Internal-Service");
        if (internalSecret != null && internalSecret.equals(incomingInternal)) {
            return; // ✅ trusted internal call
        }

        // Tier 2: verified user identity (injected by Gateway after JWT validation)
        String callerRole   = req.getHeader("X-User-Role");
        Long   callerUserId = parseUserId(req.getHeader("X-User-Id"));

        if (callerRole == null || callerUserId == null) {
            throw new UnauthorizedException("Missing authentication headers"); // 401
        }
        if ("ADMIN".equals(callerRole)) return; // ✅ admin — unrestricted
        if ("CUSTOMER".equals(callerRole) && resourceUserId.equals(callerUserId)) return; // ✅ own cart

        // Authenticated but not authorized (wrong cart)
        throw new AccessDeniedException("Access denied: You can only access your own cart"); // 403
    }

    // ── POST /cart — Add item ─────────────────────────────────────────────────
    // Body userId is overridden with X-User-Id for non-internal requests to prevent spoofing.

    @PostMapping
    public ResponseEntity<CartResponse> addItem(@RequestBody CartItemRequest request,
                                                HttpServletRequest httpRequest) {
        // For user (non-internal) calls: override body userId with the verified Gateway header.
        // This prevents a malicious client from adding items to another user's cart.
        String incomingInternal = httpRequest.getHeader("X-Internal-Service");
        if (!internalSecret.equals(incomingInternal)) {
            Long callerUserId = parseUserId(httpRequest.getHeader("X-User-Id"));
            if (callerUserId != null) {
                request.setUserId(callerUserId);
            }
        }
        enforceCartAccess(request.getUserId(), httpRequest);
        log.info("Adding item — userId: {}, productId: {}, quantity: {}",
                request.getUserId(), request.getProductId(), request.getQuantity());
        CartResponse response = cartService.addItem(request);
        log.info("Item added to cart for userId: {}", request.getUserId());
        return ResponseEntity.ok(response);
    }

    // ── GET /cart/{userId} — Fetch cart ──────────────────────────────────────

    @GetMapping("/{userId}")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long userId,
                                                HttpServletRequest request) {
        enforceCartAccess(userId, request);
        log.info("Fetching cart for userId: {}", userId);
        CartResponse response = cartService.getCart(userId);
        log.info("Cart fetched for userId: {} — {} items", userId, response.getItems().size());
        return ResponseEntity.ok(response);
    }

    // ── DELETE /cart/{userId}/{productId} — Remove one item ──────────────────

    @DeleteMapping("/{userId}/{productId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long userId,
                                           @PathVariable Long productId,
                                           HttpServletRequest request) {
        enforceCartAccess(userId, request);
        log.info("Removing productId: {} from cart of userId: {}", productId, userId);
        cartService.removeItem(userId, productId);
        log.info("Product: {} removed from cart of userId: {}", productId, userId);
        return ResponseEntity.noContent().build();
    }

    // ── DELETE /cart/{userId} — Clear entire cart ─────────────────────────────

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId,
                                          HttpServletRequest request) {
        enforceCartAccess(userId, request);
        log.warn("Clearing entire cart for userId: {}", userId);
        cartService.clearCart(userId);
        log.warn("Cart cleared for userId: {}", userId);
        return ResponseEntity.noContent().build();
    }
}