package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.NotificationResponse;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.UserRepository;
import com.smartbackend.smart_control_system.service.NotificationService;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService,
                                  UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @GetMapping("/notifications/{userId}")
    public List<NotificationResponse> getUserNotifications(@PathVariable Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationService.getUserNotifications(user)
                .stream()
                .map(notificationService::convertToResponse)
                .collect(Collectors.toList());
    }

    @PostMapping("/notifications/read/{id}")
    public void markNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }

    @GetMapping("/api/users/{userId}/notifications")
    public List<NotificationResponse> getUserNotificationsLegacy(@PathVariable Long userId) {
        return getUserNotifications(userId);
    }

    @GetMapping("/api/users/{userId}/notifications/unread")
    public List<NotificationResponse> getUnreadNotificationsLegacy(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationService.getUnreadNotifications(user)
                .stream()
                .map(notificationService::convertToResponse)
                .collect(Collectors.toList());
    }

    @PostMapping("/api/notifications/{id}/read")
    public void markNotificationAsReadLegacy(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }
}