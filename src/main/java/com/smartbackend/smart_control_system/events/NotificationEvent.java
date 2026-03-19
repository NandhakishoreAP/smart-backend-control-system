package com.smartbackend.smart_control_system.events;

import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.entity.User;

public class NotificationEvent {

    private final String message;
    private final NotificationType type;
    private final User user;

    public NotificationEvent(String message, NotificationType type, User user) {
        this.message = message;
        this.type = type;
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public NotificationType getType() {
        return type;
    }

    public User getUser() {
        return user;
    }
}