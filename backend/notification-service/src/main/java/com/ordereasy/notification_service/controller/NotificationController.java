package com.ordereasy.notification_service.controller;

import com.ordereasy.notification_service.entity.Notification;
import com.ordereasy.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 🔹 Get all notifications
    @GetMapping("/{userId}")
    public List<Notification> getAllNotifications(@PathVariable Long userId) {
        return notificationService.getAllNotifications(userId);
    }

    // 🔹 Get unread notifications
    @GetMapping("/{userId}/unread")
    public List<Notification> getUnreadNotifications(@PathVariable Long userId) {
        return notificationService.getUnreadNotifications(userId);
    }

    // 🔹 Mark single notification as read
    @PatchMapping("/{id}/read")
    public String markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return "Notification marked as read";
    }

    // 🔹 Mark all notifications as read
    @PatchMapping("/{userId}/read-all")
    public String markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
        return "All notifications marked as read";
    }
}