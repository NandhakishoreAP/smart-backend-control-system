package com.smartbackend.smart_control_system.dto;

import java.time.LocalDateTime;

public class ApiKeyResponse {

    private Long id;
    private String apiKey;
    private Long userId;
    private boolean active;
    private LocalDateTime createdAt;

    public ApiKeyResponse(Long id, String apiKey, Long userId, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.apiKey = apiKey;
        this.userId = userId;
        this.active = active;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getApiKey() { return apiKey; }
    public Long getUserId() { return userId; }
    public boolean isActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}