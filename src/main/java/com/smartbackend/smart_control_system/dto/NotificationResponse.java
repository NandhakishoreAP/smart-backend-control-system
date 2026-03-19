package com.smartbackend.smart_control_system.dto;

import com.smartbackend.smart_control_system.entity.NotificationType;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private Long userId;
    private String message;
    private NotificationType type;
    private boolean read;
    private LocalDateTime createdAt;

    public NotificationResponse(Long id,
                                Long userId,
                                String message,
                                NotificationType type,
                                boolean read,
                                LocalDateTime createdAt) {

        this.id = id;
        this.userId = userId;
        this.message = message;
        this.type = type;
        this.read = read;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }

    public Long getUserId() { return userId; }

    public String getMessage() { return message; }

    public NotificationType getType() { return type; }

    public boolean isRead() { return read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}