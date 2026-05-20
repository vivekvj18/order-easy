package com.ordereasy.delivery_service.repository;

import com.ordereasy.delivery_service.entity.DeliveryPartner;
import com.ordereasy.delivery_service.entity.PartnerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {

    List<DeliveryPartner> findByStatus(PartnerStatus status);

    Optional<DeliveryPartner> findByAuthUserId(Long authUserId);

    long countByStatus(PartnerStatus status);
}
