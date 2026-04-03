package com.ordereasy.inventory_service.service.impl;

import com.ordereasy.inventory_service.dto.CreateProductRequest;
import com.ordereasy.inventory_service.dto.ProductResponse;
import com.ordereasy.inventory_service.entity.Product;
import com.ordereasy.inventory_service.repository.ProductRepository;
import com.ordereasy.inventory_service.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public ProductResponse createProduct(CreateProductRequest request) {

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .createdAt(LocalDateTime.now())
                .build();

        Product savedProduct = productRepository.save(product);

        return ProductResponse.builder()
                .id(savedProduct.getId())
                .name(savedProduct.getName())
                .description(savedProduct.getDescription())
                .price(savedProduct.getPrice())
                .category(savedProduct.getCategory())
                .build();

    }
}
