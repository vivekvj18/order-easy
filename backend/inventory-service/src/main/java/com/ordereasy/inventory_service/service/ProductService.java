package com.ordereasy.inventory_service.service;

import com.ordereasy.inventory_service.dto.CreateProductRequest;
import com.ordereasy.inventory_service.dto.ProductResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(CreateProductRequest request);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Long id);

    ProductResponse updateProduct(Long id, CreateProductRequest request);

    void deleteProduct(Long id);
}