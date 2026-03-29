package com.smartbackend.smart_control_system.dto;

public class ApiResponse {

    private Long id;
    private String name;
    private String slug;
    private String version;
    private String description;
    private boolean active;
    private Integer rateLimit;
    private Integer violationThreshold;
    private Integer violationWindowSeconds;
    private Integer blockDurationSeconds;
    private Integer usageThresholdPercent;
    private String resetInterval;
    private String upstreamUrl;
    private Long providerId;
    
    // Mock Response
    private boolean isMockResponseEnabled;
    private String mockResponseBody;
    private Integer mockResponseStatus;

    // Mock API
    private boolean isMockedApi;
    private Long originalApiId;

    private String createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Integer getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(Integer rateLimit) {
        this.rateLimit = rateLimit;
    }

    public Integer getViolationThreshold() {
        return violationThreshold;
    }

    public void setViolationThreshold(Integer violationThreshold) {
        this.violationThreshold = violationThreshold;
    }

    public Integer getViolationWindowSeconds() {
        return violationWindowSeconds;
    }

    public void setViolationWindowSeconds(Integer violationWindowSeconds) {
        this.violationWindowSeconds = violationWindowSeconds;
    }

    public Integer getBlockDurationSeconds() {
        return blockDurationSeconds;
    }

    public void setBlockDurationSeconds(Integer blockDurationSeconds) {
        this.blockDurationSeconds = blockDurationSeconds;
    }

    public Integer getUsageThresholdPercent() {
        return usageThresholdPercent;
    }

    public void setUsageThresholdPercent(Integer usageThresholdPercent) {
        this.usageThresholdPercent = usageThresholdPercent;
    }

    public String getResetInterval() {
        return resetInterval;
    }

    public void setResetInterval(String resetInterval) {
        this.resetInterval = resetInterval;
    }

    public String getUpstreamUrl() {
        return upstreamUrl;
    }

    public void setUpstreamUrl(String upstreamUrl) {
        this.upstreamUrl = upstreamUrl;
    }

    public Long getProviderId() {
        return providerId;
    }

    public void setProviderId(Long providerId) {
        this.providerId = providerId;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isMockResponseEnabled() {
        return isMockResponseEnabled;
    }

    public void setMockResponseEnabled(boolean mockResponseEnabled) {
        isMockResponseEnabled = mockResponseEnabled;
    }

    public String getMockResponseBody() {
        return mockResponseBody;
    }

    public void setMockResponseBody(String mockResponseBody) {
        this.mockResponseBody = mockResponseBody;
    }

    public Integer getMockResponseStatus() {
        return mockResponseStatus;
    }

    public void setMockResponseStatus(Integer mockResponseStatus) {
        this.mockResponseStatus = mockResponseStatus;
    }

    public boolean isMockedApi() {
        return isMockedApi;
    }

    public void setMockedApi(boolean mockedApi) {
        isMockedApi = mockedApi;
    }

    public Long getOriginalApiId() {
        return originalApiId;
    }

    public void setOriginalApiId(Long originalApiId) {
        this.originalApiId = originalApiId;
    }
}