package com.ordereasy.inventory_service.service;

import com.ordereasy.inventory_service.dto.CreateProductRequest;
import com.ordereasy.inventory_service.dto.ProductResponse;

public interface ProductService {
    ProductResponse createProduct(CreateProductRequest request);

}
