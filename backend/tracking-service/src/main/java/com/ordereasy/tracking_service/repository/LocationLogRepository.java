package com.ordereasy.tracking_service.repository;

import com.ordereasy.tracking_service.entity.LocationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LocationLogRepository extends JpaRepository<LocationLog, Long> {

    // Latest location fetch karega
    Optional<LocationLog> findTopByOrderIdOrderByTimestampDesc(Long orderId);

    // Full history fetch karega
    List<LocationLog> findByOrderIdOrderByTimestampDesc(Long orderId);
}
