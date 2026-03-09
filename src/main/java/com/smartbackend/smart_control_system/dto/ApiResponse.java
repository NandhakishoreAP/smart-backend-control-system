package com.smartbackend.smart_control_system.dto;

import java.time.LocalDateTime;

public class ApiResponse {

    private Long id;
    private String name;
    private String description;
    private Long ownerId;
    private LocalDateTime createdAt;

    public ApiResponse(Long id, String name, String description,
                       Long ownerId, LocalDateTime createdAt) {

        this.id = id;
        this.name = name;
        this.description = description;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Long getOwnerId() { return ownerId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}