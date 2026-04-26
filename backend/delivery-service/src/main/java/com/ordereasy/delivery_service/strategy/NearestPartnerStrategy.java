package com.ordereasy.delivery_service.strategy;

import com.ordereasy.delivery_service.entity.DeliveryPartner;
import com.ordereasy.delivery_service.event.OrderCreatedEvent;
import com.ordereasy.delivery_service.util.HaversineUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Component
@Primary
public class NearestPartnerStrategy implements DeliveryAssignmentStrategy {

    @Override
    public DeliveryPartner assign(List<DeliveryPartner> partners, OrderCreatedEvent order) {

        // Fallback 1 — no partners at all
        if (partners == null || partners.isEmpty()) {
            throw new RuntimeException("No delivery partner available");
        }

        // Fallback 2 — no customer coordinates → use first available
        if (order == null
                || order.getDeliveryLatitude() == null
                || order.getDeliveryLongitude() == null) {
            log.warn("No delivery coordinates provided. Falling back to first available partner.");
            return partners.get(0);
        }

        // Filter partners who have coordinates
        List<DeliveryPartner> partnersWithLocation = partners.stream()
                .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                .toList();

        // Fallback 3 — no partner has coordinates → use first available
        if (partnersWithLocation.isEmpty()) {
            log.warn("No partners have location data. Falling back to first available partner.");
            return partners.get(0);
        }

        // Core logic — find nearest partner using Haversine
        DeliveryPartner nearest = partnersWithLocation.stream()
                .min(Comparator.comparingDouble(partner ->
                        HaversineUtil.calculateDistance(
                                partner.getLatitude(),
                                partner.getLongitude(),
                                order.getDeliveryLatitude(),
                                order.getDeliveryLongitude()
                        )))
                .orElse(partners.get(0));

        // Log the distance for observability
        double distance = HaversineUtil.calculateDistance(
                nearest.getLatitude(),
                nearest.getLongitude(),
                order.getDeliveryLatitude(),
                order.getDeliveryLongitude()
        );

        log.info("Nearest partner: {} selected at distance: {} km for orderId: {}",
                nearest.getName(), String.format("%.2f", distance), order.getOrderId());

        return nearest;
    }
}