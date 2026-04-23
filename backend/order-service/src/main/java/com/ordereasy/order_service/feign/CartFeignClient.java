package com.ordereasy.order_service.feign;

import com.ordereasy.order_service.dto.CartResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "cart-service")
public interface CartFeignClient {

    @GetMapping("/cart/{userId}")
    CartResponse getCart(@PathVariable("userId") Long userId);

    @DeleteMapping("/cart/{userId}")
    void clearCart(@PathVariable("userId") Long userId);
}
