package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;

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
    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);
    private final JwtService jwtService;

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService,
                                  UserRepository userRepository,
                                  JwtService jwtService) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @GetMapping("/notifications/{userId}")
    public List<NotificationResponse> getUserNotifications(@PathVariable Long userId, HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        logger.info("[NOTIF] --- NOTIFICATION REQUEST ---");
        logger.info("[NOTIF] Authorization header: {}", header);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            logger.info("[NOTIF] JWT token: {}", token);
        }
        if (header == null || !header.startsWith("Bearer ")) {
            logger.warn("[NOTIF] Missing or invalid Authorization header");
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
        }
        String token = header.substring(7);
        logger.info("[NOTIF] Extracted token: {}", token);
        Long tokenUserId = jwtService.extractUserId(token);
        logger.info("[NOTIF] Extracted userId from token: {} (requested userId: {})", tokenUserId, userId);
        logger.info("[NOTIF] localStorage userId (if sent by frontend): {}", request.getParameter("userId"));
        if (tokenUserId == null) {
            logger.warn("[NOTIF] Invalid or expired token");
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }
        if (!tokenUserId.equals(userId)) {
            logger.warn("[NOTIF] Forbidden: token userId {} does not match requested userId {}", tokenUserId, userId);
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Forbidden: You can only access your own notifications");
        }
        userRepository.findById(userId).ifPresentOrElse(
            user -> logger.info("[NOTIF] User found: {} (id: {})", user.getEmail(), user.getId()),
            () -> logger.warn("[NOTIF] User not found in DB for id: {}", userId)
        );
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "User not found"));
        logger.info("[NOTIF] Returning notifications for user: {} (id: {})", user.getEmail(), user.getId());
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
    public List<NotificationResponse> getUserNotificationsLegacy(@PathVariable Long userId, HttpServletRequest request) {
        return getUserNotifications(userId, request);
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