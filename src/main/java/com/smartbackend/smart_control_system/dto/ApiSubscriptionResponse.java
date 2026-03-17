package com.smartbackend.smart_control_system.dto;

import java.time.LocalDateTime;

public class ApiSubscriptionResponse {

    private Long id;
    private Long apiId;
    private String apiName;
    private String description;
    private LocalDateTime subscribedAt;

    public ApiSubscriptionResponse(Long id, Long apiId, String apiName, String description, LocalDateTime subscribedAt) {
        this.id = id;
        this.apiId = apiId;
        this.apiName = apiName;
        this.description = description;
        this.subscribedAt = subscribedAt;
    }

    public Long getId() { return id; }
    public Long getApiId() { return apiId; }
    public String getApiName() { return apiName; }
    public String getDescription() { return description; }
    public LocalDateTime getSubscribedAt() { return subscribedAt; }
}
