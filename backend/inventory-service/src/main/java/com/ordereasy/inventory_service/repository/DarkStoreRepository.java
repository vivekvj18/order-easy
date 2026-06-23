package com.ordereasy.inventory_service.repository;

import com.ordereasy.inventory_service.entity.DarkStore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository for DarkStore entity.
 *
 * findByActiveTrueAndLatitudeBetweenAndLongitudeBetween:
 *   Pre-filters active stores using a bounding box before the Haversine sort.
 *   This avoids scanning ALL stores for every checkout request.
 *
 * Interview note:
 *   Bounding box is a fast O(n) pre-filter. Haversine is then computed only on
 *   candidate stores inside the box. Future optimization: spatial index / Redis GEO.
 */
public interface DarkStoreRepository extends JpaRepository<DarkStore, Long> {

    /**
     * Finds all active dark stores whose coordinates fall within the given bounding box.
     *
     * @param minLat southern latitude boundary
     * @param maxLat northern latitude boundary
     * @param minLng western longitude boundary
     * @param maxLng eastern longitude boundary
     * @return list of active DarkStore entities within the bounding box
     */
    List<DarkStore> findByActiveTrueAndLatitudeBetweenAndLongitudeBetween(
            Double minLat,
            Double maxLat,
            Double minLng,
            Double maxLng
    );
}
