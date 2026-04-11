package com.ordereasy.notification_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordereasy.notification_service.entity.Notification;
import com.ordereasy.notification_service.entity.NotificationType;
import com.ordereasy.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "order-created", groupId = "notification-group")
    public void handleOrderCreated(String message) {
        try {
            OrderCreatedEvent event = objectMapper.readValue(message, OrderCreatedEvent.class);
            log.info("order-created event received: orderId={}", event.getOrderId());

            Notification notification = Notification.builder()
                    .userId(event.getUserId())
                    .userEmail(event.getUserEmail())
                    .orderId(event.getOrderId())
                    .message("Your order #" + event.getOrderId() + " has been placed successfully!")
                    .type(NotificationType.ORDER_PLACED)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);
            log.info("Notification saved: ORDER_PLACED for orderId={}", event.getOrderId());

        } catch (Exception e) {
            log.error("Failed to process order-created event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "order-status-updated", groupId = "notification-group")
    public void handleStatusUpdate(String message) {
        try {
            OrderStatusUpdatedEvent event = objectMapper.readValue(message, OrderStatusUpdatedEvent.class);
            log.info("order-status-updated event received: orderId={}", event.getOrderId());

            Notification notification = Notification.builder()
                    .userId(event.getUserId())
                    .userEmail(event.getUserEmail())
                    .orderId(event.getOrderId())
                    .message("Your order #" + event.getOrderId() + " status updated to " + event.getNewStatus())
                    .type(NotificationType.STATUS_UPDATED)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);
            log.info("Notification saved: STATUS_UPDATED for orderId={}", event.getOrderId());

        } catch (Exception e) {
            log.error("Failed to process order-status-updated event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "order-cancelled", groupId = "notification-group")
    public void handleOrderCancelled(String message) {
        try {
            OrderCancelledEvent event = objectMapper.readValue(message, OrderCancelledEvent.class);
            log.info("order-cancelled event received: orderId={}", event.getOrderId());

            Notification notification = Notification.builder()
                    .userId(event.getUserId())
                    .userEmail(event.getUserEmail())
                    .orderId(event.getOrderId())
                    .message("Your order #" + event.getOrderId() + " has been cancelled")
                    .type(NotificationType.ORDER_CANCELLED)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notification);
            log.info("Notification saved: ORDER_CANCELLED for orderId={}", event.getOrderId());

        } catch (Exception e) {
            log.error("Failed to process order-cancelled event: {}", e.getMessage());
        }
    }
}