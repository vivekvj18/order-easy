package com.ordereasy.inventory_service.repository;

import com.ordereasy.inventory_service.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock,Long> {
    Optional<Stock> findByProductId(Long productId);
}
