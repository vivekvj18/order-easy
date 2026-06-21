package com.ordereasy.order_service.scheduler;

import com.ordereasy.order_service.entity.Order;
import com.ordereasy.order_service.entity.OrderStatus;
import com.ordereasy.order_service.event.OrderCancelledEvent;
import com.ordereasy.order_service.event.OrderItemEvent;
import com.ordereasy.order_service.kafka.OrderKafkaProducer;
import com.ordereasy.order_service.repository.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Scheduler that periodically finds PENDING_PAYMENT orders older than a
 * configured timeout and marks them as EXPIRED.
 *
 * For each expired order, an "order-cancelled" Kafka event is published so
 * Inventory Service can release the reserved stock.
 *
 * Safety guarantees:
 *  - Only targets PENDING_PAYMENT orders (not PAYMENT_CONFIRMED or any other status).
 *  - Inventory's releaseStock is idempotent — duplicate events safely no-op.
 *  - Each order is marked EXPIRED before the event is published, preventing
 *    the scheduler from picking it up again on the next run.
 */
@Slf4j
@Component
public class ReservationExpiryScheduler {

    private final OrderRepository orderRepository;
    private final OrderKafkaProducer kafkaProducer;

    @Value("${reservation.expiry.minutes:30}")
    private int expiryMinutes;

    public ReservationExpiryScheduler(OrderRepository orderRepository,
                                      OrderKafkaProducer kafkaProducer) {
        this.orderRepository = orderRepository;
        this.kafkaProducer = kafkaProducer;
    }

    /**
     * Runs every 60 seconds.
     * Finds all PENDING_PAYMENT orders older than `reservation.expiry.minutes`
     * and expires them.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expireStaleReservations() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(expiryMinutes);
        log.info("[ExpiryScheduler] Checking for PENDING_PAYMENT orders older than {} minutes (cutoff: {})",
                expiryMinutes, cutoff);

        List<Order> staleOrders = orderRepository
                .findByStatusAndCreatedAtBefore(OrderStatus.PENDING_PAYMENT, cutoff);

        if (staleOrders.isEmpty()) {
            log.debug("[ExpiryScheduler] No stale PENDING_PAYMENT orders found.");
            return;
        }

        log.info("[ExpiryScheduler] Found {} stale PENDING_PAYMENT order(s) to expire.", staleOrders.size());

        for (Order order : staleOrders) {
            try {
                log.info("[ExpiryScheduler] Expiring orderId: {} (createdAt: {}, userId: {})",
                        order.getId(), order.getCreatedAt(), order.getUserId());

                // 1. Mark order as EXPIRED (prevents re-processing on next scheduler run)
                order.setStatus(OrderStatus.EXPIRED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);

                // 2. Build and publish order-cancelled event so Inventory releases stock
                List<OrderItemEvent> itemEvents = order.getItems().stream()
                        .map(item -> {
                            OrderItemEvent e = new OrderItemEvent();
                            e.setProductId(item.getProductId());
                            e.setQuantity(item.getQuantity());
                            return e;
                        })
                        .collect(Collectors.toList());

                OrderCancelledEvent cancelEvent = new OrderCancelledEvent();
                cancelEvent.setOrderId(order.getId());
                cancelEvent.setUserId(order.getUserId());
                cancelEvent.setUserEmail(order.getUserEmail());
                cancelEvent.setItems(itemEvents);

                kafkaProducer.sendOrderCancelledEvent(cancelEvent);

                log.info("[ExpiryScheduler] orderId: {} marked EXPIRED, order-cancelled event published. " +
                        "Items count: {}", order.getId(), itemEvents.size());

            } catch (Exception e) {
                log.error("[ExpiryScheduler] Failed to expire orderId: {}. Error: {}",
                        order.getId(), e.getMessage(), e);
                // Continue processing remaining orders — partial failure is acceptable here
            }
        }

        log.info("[ExpiryScheduler] Expiry run complete. Processed {} order(s).", staleOrders.size());
    }
}
