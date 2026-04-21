package com.ordereasy.cart_service.service;

import com.ordereasy.cart_service.dto.*;
import com.ordereasy.cart_service.entity.CartItem;
import com.ordereasy.cart_service.feign.ProductFeignClient;
import com.ordereasy.cart_service.repository.CartRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductFeignClient productFeignClient;

    @Transactional
    public CartResponse addItem(CartItemRequest request) {
        // Validate product exists via Feign
        ProductResponse product = productFeignClient.getProductById(request.getProductId());
        
        CartItem cartItem = cartRepository.findByUserIdAndProductId(request.getUserId(), request.getProductId())
                .map(existingItem -> {
                    existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
                    return existingItem;
                })
                .orElse(CartItem.builder()
                        .userId(request.getUserId())
                        .productId(request.getProductId())
                        .quantity(request.getQuantity())
                        .build());
        
        cartRepository.save(cartItem);
        return getCart(request.getUserId());
    }

    public CartResponse getCart(Long userId) {
        List<CartItem> items = cartRepository.findByUserId(userId);
        
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
    }

    @Transactional
    public void removeItem(Long userId, Long productId) {
        cartRepository.findByUserIdAndProductId(userId, productId)
                .ifPresent(cartRepository::delete);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartRepository.deleteByUserId(userId);
    }
}
