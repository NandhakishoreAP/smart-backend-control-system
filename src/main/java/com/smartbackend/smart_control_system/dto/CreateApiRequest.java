package com.smartbackend.smart_control_system.dto;

public class CreateApiRequest {

    private Long userId;
    private String name;
    private String description;

    public Long getUserId() { return userId; }

    public String getName() { return name; }

    public String getDescription() { return description; }
}