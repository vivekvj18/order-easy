package com.ordereasy.delivery_service.repository;

import com.ordereasy.delivery_service.entity.DeliveryPartner;
import com.ordereasy.delivery_service.entity.PartnerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {

    List<DeliveryPartner> findByStatus(PartnerStatus status);

    Optional<DeliveryPartner> findByAuthUserId(Long authUserId);

    long countByStatus(PartnerStatus status);

    /**
     * Fetch all AVAILABLE partners who have non-null latitude and longitude.
     * Used by PickupAwareNearestPartnerStrategy to get the candidate pool
     * before radius filtering.
     */
    @Query("SELECT p FROM DeliveryPartner p " +
           "WHERE p.status = com.ordereasy.delivery_service.entity.PartnerStatus.AVAILABLE " +
           "AND p.latitude IS NOT NULL " +
           "AND p.longitude IS NOT NULL")
    List<DeliveryPartner> findAvailableWithLocation();
}
