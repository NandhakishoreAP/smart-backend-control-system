package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;

    @Convert(converter = NotificationTypeConverter.class)
    private NotificationType type;

    @Column(name = "read_status")
    private boolean read;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Notification() {
        this.createdAt = LocalDateTime.now();
        this.read = false;
    }

    public Notification(String message, NotificationType type, User user) {
        this.message = message;
        this.type = type;
        this.user = user;
        this.createdAt = LocalDateTime.now();
        this.read = false;
    }

    public Long getId() { return id; }

    public String getMessage() { return message; }

    public NotificationType getType() { return type; }

    public boolean isRead() { return read; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public User getUser() { return user; }

    public void setRead(boolean read) {
        this.read = read;
    }

    public Long getUserId() {
        return user == null ? null : user.getId();
    }
}