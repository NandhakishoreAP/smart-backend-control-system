package com.smartbackend.smart_control_system.events;

import com.smartbackend.smart_control_system.service.NotificationService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {

    private final NotificationService notificationService;

    public NotificationEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {

        notificationService.createNotification(
                event.getMessage(),
                event.getType(),
                event.getUser()
        );
    }
}