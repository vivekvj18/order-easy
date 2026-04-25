package com.ordereasy.cart_service.controller;

import com.ordereasy.cart_service.dto.CartItemRequest;
import com.ordereasy.cart_service.dto.CartResponse;
import com.ordereasy.cart_service.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PostMapping
    public ResponseEntity<CartResponse> addItem(@RequestBody CartItemRequest request) {
        log.info("Adding item — userId: {}, productId: {}, quantity: {}",
                request.getUserId(), request.getProductId(), request.getQuantity());
        CartResponse response = cartService.addItem(request);
        log.info("Item added to cart for userId: {}", request.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long userId) {
        log.info("Fetching cart for userId: {}", userId);
        CartResponse response = cartService.getCart(userId);
        log.info("Cart fetched for userId: {} — {} items", userId, response.getItems().size());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}/{productId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long userId,
                                           @PathVariable Long productId) {
        log.info("Removing productId: {} from cart of userId: {}", productId, userId);
        cartService.removeItem(userId, productId);
        log.info("Product: {} removed from cart of userId: {}", productId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        log.warn("Clearing entire cart for userId: {}", userId);
        cartService.clearCart(userId);
        log.warn("Cart cleared for userId: {}", userId);
        return ResponseEntity.noContent().build();
    }
}