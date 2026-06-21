package com.ordereasy.inventory_service.repository;

import com.ordereasy.inventory_service.entity.FinalizedOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinalizedOrderRepository extends JpaRepository<FinalizedOrder, Long> {

    boolean existsByOrderId(Long orderId);
}
