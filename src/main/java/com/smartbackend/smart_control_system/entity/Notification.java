package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private boolean readStatus;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Notification() {
        this.createdAt = LocalDateTime.now();
        this.readStatus = false;
    }

    public Notification(String title, String message, NotificationType type, User user) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.user = user;
        this.createdAt = LocalDateTime.now();
        this.readStatus = false;
    }

    public Long getId() { return id; }

    public String getTitle() { return title; }

    public String getMessage() { return message; }

    public NotificationType getType() { return type; }

    public boolean isReadStatus() { return readStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public User getUser() { return user; }

    public void setReadStatus(boolean readStatus) {
        this.readStatus = readStatus;
    }
}