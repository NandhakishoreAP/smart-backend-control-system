package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.entity.Notification;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.UserRepository;
import com.smartbackend.smart_control_system.service.NotificationService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService,
                                  UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @GetMapping("/users/{userId}/notifications")
    public List<Notification> getUserNotifications(@PathVariable Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationService.getUserNotifications(user);
    }

    @GetMapping("/users/{userId}/notifications/unread")
    public List<Notification> getUnreadNotifications(@PathVariable Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationService.getUnreadNotifications(user);
    }

    @PostMapping("/notifications/{id}/read")
    public void markNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }
}