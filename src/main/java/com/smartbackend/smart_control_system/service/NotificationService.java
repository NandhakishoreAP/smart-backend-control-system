package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.NotificationResponse;
import com.smartbackend.smart_control_system.entity.Notification;
import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    public NotificationService(NotificationRepository notificationRepository,
                               SimpMessagingTemplate messagingTemplate,
                               EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.emailService = emailService;
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUser(user);
    }

    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndReadFalse(user);
    }

    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public Notification createNotification(String message, NotificationType type, User user) {
        return createNotification(message, type, user, true);
    }

    public Notification createNotificationNoEmail(String message, NotificationType type, User user) {
        return createNotification(message, type, user, false);
    }

    private Notification createNotification(String message, NotificationType type, User user, boolean sendEmail) {
        Notification notification = new Notification(message, type, user);
        Notification savedNotification = notificationRepository.save(notification);

        // WebSocket push
        if (user != null) {
            NotificationResponse response = convertToResponse(savedNotification);
            try {
                messagingTemplate.convertAndSend(
                    "/topic/user/" + user.getId() + "/notifications",
                    response
                );
            } catch (Exception e) {
                logger.error("WebSocket notification push failed for user {}: {}", user.getId(), e.getMessage(), e);
            }
        }

        // Email alert
        if (sendEmail && user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                emailService.sendNotificationEmail(user.getEmail(), type, message);
            } catch (Exception e) {
                logger.error("Email sending failed for user {}: {}", user.getId(), e.getMessage(), e);
            }
        }

        return savedNotification;
    }

    public NotificationResponse convertToResponse(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getUserId(),
            notification.getMessage(),
            notification.getType(),
            notification.isRead(),
            notification.getCreatedAt()
        );
    }
}