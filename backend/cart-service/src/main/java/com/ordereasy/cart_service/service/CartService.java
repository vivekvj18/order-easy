package com.ordereasy.cart_service.service;

import com.ordereasy.cart_service.dto.*;
import com.ordereasy.cart_service.entity.Cart;
import com.ordereasy.cart_service.entity.CartItem;
import com.ordereasy.cart_service.feign.ProductFeignClient;
import com.ordereasy.cart_service.repository.CartItemRepository;
import com.ordereasy.cart_service.repository.CartRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.ordereasy.cart_service.exception.ServiceUnavailableException;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductFeignClient productFeignClient;

    // ── Add Item ──────────────────────────────────────────────────────────────

    /**
     * Add a product to the user's cart (or update quantity if already present).
     *
     * <p>Flow:
     * <ol>
     *   <li>Validate quantity — zero or negative values are rejected.</li>
     *   <li>Validate product exists via OpenFeign → Product Service.</li>
     *   <li>Get-or-create the user's cart (one cart per user, unique by userId).</li>
     *   <li>Check whether the product is already in the cart:
     *       <ul>
     *         <li>If yes → increment quantity.</li>
     *         <li>If no  → insert a new CartItem row.</li>
     *       </ul>
     *   </li>
     *   <li>Return the full updated CartResponse.</li>
     * </ol>
     *
     * @param request contains userId (overridden from X-User-Id by controller), productId, quantity
     * @return updated CartResponse
     */
    @Transactional
    @CircuitBreaker(name = "productServiceCB", fallbackMethod = "handleProductFallback")
    public CartResponse addItem(CartItemRequest request) {

        // ── Guard: quantity must be positive ──────────────────────────────────
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be a positive integer");
        }

        // ── Step 1: Validate product via Product Service (OpenFeign) ──────────
        ProductResponse product = productFeignClient.getProductById(request.getProductId());
        log.debug("Product validated — id: {}, name: {}", product.getId(), product.getName());

        // ── Step 2: Get or create the user's cart ─────────────────────────────
        Cart cart = cartRepository.findByUserId(request.getUserId())
                .orElseGet(() -> {
                    log.info("No existing cart for userId: {} — creating new cart", request.getUserId());
                    Cart newCart = Cart.builder()
                            .userId(request.getUserId())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return cartRepository.save(newCart);
                });

        // ── Step 3: Check whether this product is already in the cart ─────────
        cartItemRepository.findByCartAndProductId(cart, request.getProductId())
                .ifPresentOrElse(
                        existingItem -> {
                            // Product already in cart — increment quantity
                            int updatedQty = existingItem.getQuantity() + request.getQuantity();
                            existingItem.setQuantity(updatedQty);
                            existingItem.setUpdatedAt(LocalDateTime.now());
                            cartItemRepository.save(existingItem);
                            log.info("Updated quantity for productId: {} in cartId: {} → new qty: {}",
                                    request.getProductId(), cart.getId(), updatedQty);
                        },
                        () -> {
                            // New product — insert a new CartItem row
                            CartItem newItem = CartItem.builder()
                                    .cart(cart)
                                    .productId(request.getProductId())
                                    .quantity(request.getQuantity())
                                    .createdAt(LocalDateTime.now())
                                    .updatedAt(LocalDateTime.now())
                                    .build();
                            cartItemRepository.save(newItem);
                            log.info("Added new CartItem — cartId: {}, productId: {}, qty: {}",
                                    cart.getId(), request.getProductId(), request.getQuantity());
                        }
                );

        // ── Step 4: Bump cart updatedAt and persist ───────────────────────────
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return getCart(request.getUserId());
    }

    // ── Get Cart ──────────────────────────────────────────────────────────────

    /**
     * Fetch the cart for a user and enrich each item with product details.
     *
     * <p>If the user has no cart yet (has never added anything), returns an empty
     * CartResponse instead of throwing an exception — this keeps the API stable
     * for Order Service which calls GET /cart/{userId} during checkout.
     *
     * @param userId the trusted user identity from X-User-Id header
     * @return CartResponse with items list and totalAmount (both empty/0.0 if no cart)
     */
    @CircuitBreaker(name = "productServiceCB", fallbackMethod = "handleProductFallback")
    public CartResponse getCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .map(cart -> {
                    List<CartItem> items = cart.getItems();

                    List<CartItemResponse> itemResponses = items.stream()
                            .map(item -> {
                                ProductResponse product = productFeignClient.getProductById(item.getProductId());
                                return CartItemResponse.builder()
                                        .id(item.getId())
                                        .productId(item.getProductId())
                                        .productName(product.getName())
                                        .price(product.getPrice())
                                        .quantity(item.getQuantity())
                                        .subtotal(product.getPrice() * item.getQuantity())
                                        .build();
                            })
                            .collect(Collectors.toList());

                    double totalAmount = itemResponses.stream()
                            .mapToDouble(CartItemResponse::getSubtotal)
                            .sum();

                    return CartResponse.builder()
                            .userId(userId)
                            .items(itemResponses)
                            .totalAmount(totalAmount)
                            .build();
                })
                // No cart exists yet — return empty response (never throw for a missing cart)
                .orElse(CartResponse.builder()
                        .userId(userId)
                        .items(Collections.emptyList())
                        .totalAmount(0.0)
                        .build());
    }

    // ── Remove Item ───────────────────────────────────────────────────────────

    /**
     * Remove a single product from the user's cart.
     *
     * <p>If the user has no cart, or the product is not in the cart, this is a no-op.
     *
     * @param userId    the trusted user identity
     * @param productId the product to remove
     */
    @Transactional
    public void removeItem(Long userId, Long productId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cartItemRepository.deleteByCartAndProductId(cart, productId);
            cart.setUpdatedAt(LocalDateTime.now());
            cartRepository.save(cart);
            log.info("Removed productId: {} from cartId: {} (userId: {})", productId, cart.getId(), userId);
        });
    }

    // ── Clear Cart ────────────────────────────────────────────────────────────

    /**
     * Remove all items from the user's cart.
     *
     * <p>The {@link Cart} row itself is intentionally preserved — only its items
     * are deleted. This is done via {@code cart.getItems().clear()} which triggers
     * JPA {@code orphanRemoval = true}, deleting all {@code cart_items} rows for
     * this cart without dropping the cart itself.
     *
     * <p>Preserving the cart row avoids a race condition during checkout: if Order
     * Service calls {@code DELETE /cart/{userId}} and then immediately calls
     * {@code GET /cart/{userId}}, it will receive an empty list rather than a 404.
     *
     * @param userId the trusted user identity
     */
    @Transactional
    public void clearCart(Long userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();          // orphanRemoval deletes all cart_item rows
            cart.setUpdatedAt(LocalDateTime.now());
            cartRepository.save(cart);
            log.warn("Cart cleared for userId: {} (cartId: {}) — all items removed, cart row preserved",
                    userId, cart.getId());
        });
    }

    // ── Fallback ──────────────────────────────────────────────────────────────

    /**
     * Resilience4j Circuit Breaker fallback for Product Service failures.
     * Triggered when {@code productServiceCB} is OPEN or Product Service is unreachable.
     */
    public CartResponse handleProductFallback(Exception e) {
        log.warn("Product service failed — circuit breaker triggered. Error: {}", e.getMessage());
        throw new ServiceUnavailableException("Product service unavailable");
    }
}
