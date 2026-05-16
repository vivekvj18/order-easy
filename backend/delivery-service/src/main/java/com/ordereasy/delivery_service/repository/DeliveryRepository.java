package com.ordereasy.delivery_service.repository;

import com.ordereasy.delivery_service.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    Optional<Delivery> findByOrderId(Long orderId);
    List<Delivery> findByPartnerId(Long partnerId);
}