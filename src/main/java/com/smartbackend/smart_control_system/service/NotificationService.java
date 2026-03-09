package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.NotificationResponse;
import com.smartbackend.smart_control_system.entity.Notification;
import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

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
        return notificationRepository.findByUserAndReadStatusFalse(user);
    }

    public void markAsRead(Long notificationId) {

        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setReadStatus(true);

        notificationRepository.save(notification);
    }

    public Notification createNotification(
            String title,
            String message,
            NotificationType type,
            User user) {

        Notification notification =
                new Notification(title, message, type, user);

        Notification savedNotification =
                notificationRepository.save(notification);

        // WebSocket push
        if(user != null){
            messagingTemplate.convertAndSend(
                    "/topic/user/" + user.getId() + "/notifications",
                    savedNotification
            );
        }

        // Email alert
        try {
            emailService.sendAlert(title, message);
        } catch (Exception e) {
            System.out.println("Email sending failed: " + e.getMessage());
        }

        return savedNotification;
    }

    public NotificationResponse convertToResponse(Notification notification) {

        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isReadStatus(),
                notification.getCreatedAt()
        );
    }
}