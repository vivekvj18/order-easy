package com.ordereasy.delivery_service.strategy;

import com.ordereasy.delivery_service.entity.DeliveryPartner;
import com.ordereasy.delivery_service.entity.PartnerStatus;
import com.ordereasy.delivery_service.event.PaymentCompletedEvent;
import com.ordereasy.delivery_service.repository.DeliveryPartnerRepository;
import com.ordereasy.delivery_service.util.HaversineUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Pickup-aware delivery partner assignment strategy for dark-store quick-commerce.
 *
 * <p><strong>Algorithm:</strong>
 * <pre>
 *   1. Fetch all AVAILABLE partners with non-null coordinates.
 *   2. Filter partners within PRIMARY radius (default 5 km) of the selected dark store.
 *   3. If empty, retry with FALLBACK radius (default 10 km).
 *   4. If still empty, throw — no partner available.
 *   5. Score each candidate:
 *        riderToDarkStore     = Haversine(rider, darkStore)
 *        darkStoreToCustomer  = Haversine(darkStore, customer)   [constant for all riders]
 *        totalDistance        = riderToDarkStore + darkStoreToCustomer
 *   6. Assign the rider with minimum totalDistance.
 * </pre>
 *
 * <p><strong>Why include darkStoreToCustomer?</strong>
 * darkStoreToCustomer is the same for every rider for a given order, so it does not change
 * the ranking. However, including it makes totalDistance represent the <em>complete route</em>
 * (rider → dark store → customer), which is interview-friendly and accurate for traceability.
 *
 * <p>This strategy is annotated {@code @Primary} and replaces the customer-centric
 * {@link NearestPartnerStrategy} as the active bean. Both strategies remain in the codebase
 * and are interchangeable via Spring DI — consistent with the Strategy Pattern.
 */
@Slf4j
@Component
public class PickupAwareNearestPartnerStrategy {

    private final DeliveryPartnerRepository partnerRepository;

    /** Primary search radius around the dark store (km). */
    @Value("${delivery.partner.search.radius.km:5.0}")
    private double primaryRadiusKm;

    /** Fallback search radius if no partner is found within primary radius (km). */
    @Value("${delivery.partner.search.fallback.radius.km:10.0}")
    private double fallbackRadiusKm;

    public PickupAwareNearestPartnerStrategy(DeliveryPartnerRepository partnerRepository) {
        this.partnerRepository = partnerRepository;
    }

    /**
     * Assign the best available delivery partner for this payment-completed event.
     *
     * @param event the payment-completed event carrying dark store + customer coordinates
     * @return the selected DeliveryPartner
     * @throws RuntimeException if no eligible partner is found within fallback radius
     */
    public DeliveryPartner assign(PaymentCompletedEvent event) {

        double darkStoreLat = event.getDarkStoreLatitude();
        double darkStoreLon = event.getDarkStoreLongitude();
        double customerLat  = event.getDeliveryLatitude();
        double customerLon  = event.getDeliveryLongitude();

        log.info("[PickupAware] Assigning partner for orderId={} | darkStore='{}' ({}, {}) | customer=({}, {})",
                event.getOrderId(), event.getDarkStoreName(),
                darkStoreLat, darkStoreLon, customerLat, customerLon);

        // Fetch all AVAILABLE partners who have location data
        List<DeliveryPartner> candidates = partnerRepository.findAvailableWithLocation();

        if (candidates.isEmpty()) {
            throw new RuntimeException("No delivery partners available (none are AVAILABLE with location data)");
        }

        // ── Step 1: Try primary radius ─────────────────────────────────────────
        Optional<DeliveryPartner> selected = findBestInRadius(
                candidates, darkStoreLat, darkStoreLon, customerLat, customerLon,
                primaryRadiusKm, event.getOrderId()
        );

        // ── Step 2: Fallback radius if primary radius yields nothing ───────────
        if (selected.isEmpty()) {
            log.warn("[PickupAware] No partner within primary radius ({} km) for orderId={}. Trying fallback radius ({} km).",
                    primaryRadiusKm, event.getOrderId(), fallbackRadiusKm);

            selected = findBestInRadius(
                    candidates, darkStoreLat, darkStoreLon, customerLat, customerLon,
                    fallbackRadiusKm, event.getOrderId()
            );
        }

        return selected.orElseThrow(() ->
                new RuntimeException(String.format(
                        "No delivery partner found within fallback radius of %.1f km from dark store '%s' for orderId=%d",
                        fallbackRadiusKm, event.getDarkStoreName(), event.getOrderId()
                ))
        );
    }

    /**
     * Filter partners within {@code radiusKm} of the dark store, then score by total route distance.
     *
     * @return the best partner, or empty if none are within radius
     */
    private Optional<DeliveryPartner> findBestInRadius(
            List<DeliveryPartner> candidates,
            double darkStoreLat, double darkStoreLon,
            double customerLat, double customerLon,
            double radiusKm, Long orderId) {

        // darkStoreToCustomer is constant for all candidates for a given order
        double darkStoreToCustomerDistance = HaversineUtil.calculateDistance(
                darkStoreLat, darkStoreLon, customerLat, customerLon
        );

        List<DeliveryPartner> withinRadius = candidates.stream()
                .filter(p -> {
                    double riderToDarkStore = HaversineUtil.calculateDistance(
                            p.getLatitude(), p.getLongitude(), darkStoreLat, darkStoreLon
                    );
                    return riderToDarkStore <= radiusKm;
                })
                .toList();

        if (withinRadius.isEmpty()) {
            log.debug("[PickupAware] No partners within {} km radius for orderId={}", radiusKm, orderId);
            return Optional.empty();
        }

        // Score: totalDistance = riderToDarkStore + darkStoreToCustomer
        DeliveryPartner best = withinRadius.stream()
                .min(Comparator.comparingDouble(p -> {
                    double riderToDarkStore = HaversineUtil.calculateDistance(
                            p.getLatitude(), p.getLongitude(), darkStoreLat, darkStoreLon
                    );
                    return riderToDarkStore + darkStoreToCustomerDistance;
                }))
                .orElseThrow();

        // Calculate final distances for logging
        double riderToDarkStoreKm = HaversineUtil.calculateDistance(
                best.getLatitude(), best.getLongitude(), darkStoreLat, darkStoreLon
        );
        double totalDistanceKm = riderToDarkStoreKm + darkStoreToCustomerDistance;

        log.info("[PickupAware] Selected partner '{}' (id={}) for orderId={} | " +
                        "riderToDarkStore={} km | darkStoreToCustomer={} km | totalDistance={} km | radius={} km",
                best.getName(), best.getId(), orderId,
                String.format("%.2f", riderToDarkStoreKm),
                String.format("%.2f", darkStoreToCustomerDistance),
                String.format("%.2f", totalDistanceKm),
                radiusKm);

        return Optional.of(best);
    }

    /**
     * Calculate the total pickup-aware route distance for a selected partner.
     * riderToDarkStore + darkStoreToCustomer.
     *
     * @return total distance in km, or null if any coordinate is missing
     */
    public Double calculateTotalDistance(DeliveryPartner partner,
                                         double darkStoreLat, double darkStoreLon,
                                         double customerLat, double customerLon) {
        if (partner == null
                || partner.getLatitude() == null
                || partner.getLongitude() == null) {
            return null;
        }
        double riderToDarkStore = HaversineUtil.calculateDistance(
                partner.getLatitude(), partner.getLongitude(), darkStoreLat, darkStoreLon
        );
        double darkStoreToCustomer = HaversineUtil.calculateDistance(
                darkStoreLat, darkStoreLon, customerLat, customerLon
        );
        return riderToDarkStore + darkStoreToCustomer;
    }
}
