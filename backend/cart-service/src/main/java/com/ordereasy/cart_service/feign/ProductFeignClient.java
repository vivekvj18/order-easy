package com.ordereasy.cart_service.feign;

import com.ordereasy.cart_service.dto.ProductResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-service", url = "http://localhost:8082")
public interface ProductFeignClient {

    @GetMapping("/products/{id}")
    ProductResponse getProductById(@PathVariable("id") Long id);
}
