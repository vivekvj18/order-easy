package com.ordereasy.cart_service.controller;

import com.ordereasy.cart_service.dto.CartItemRequest;
import com.ordereasy.cart_service.dto.CartResponse;
import com.ordereasy.cart_service.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PostMapping
    public ResponseEntity<CartResponse> addItem(@RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.addItem(request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long userId) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @DeleteMapping("/{userId}/{productId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long userId, @PathVariable Long productId) {
        cartService.removeItem(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
