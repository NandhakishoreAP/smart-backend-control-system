package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocked_users")
public class BlockedUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long apiId;

    private String reason;

    private LocalDateTime blockedAt;

    public BlockedUser() {
        this.blockedAt = LocalDateTime.now();
    }

    public BlockedUser(Long userId, Long apiId, String reason) {
        this.userId = userId;
        this.apiId = apiId;
        this.reason = reason;
        this.blockedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Long getUserId() { return userId; }

    public Long getApiId() { return apiId; }

    public String getReason() { return reason; }

    public LocalDateTime getBlockedAt() { return blockedAt; }
}