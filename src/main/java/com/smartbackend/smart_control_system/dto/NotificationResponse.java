package com.smartbackend.smart_control_system.dto;

import com.smartbackend.smart_control_system.entity.NotificationType;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private boolean readStatus;
    private LocalDateTime createdAt;

    public NotificationResponse(Long id,
                                String title,
                                String message,
                                NotificationType type,
                                boolean readStatus,
                                LocalDateTime createdAt) {

        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.readStatus = readStatus;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }

    public String getTitle() { return title; }

    public String getMessage() { return message; }

    public NotificationType getType() { return type; }

    public boolean isReadStatus() { return readStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}