package com.smartbackend.smart_control_system.dto;

public class ProviderApiListResponse {

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
    private String upstreamUrl;
    private String createdAt;
    private long subscribers;

    // Mock API tracking
    private boolean isMockedApi;
    private Long originalApiId;

    public ProviderApiListResponse() {}

    public ProviderApiListResponse(
            Long id,
            String name,
            String slug,
            String version,
            String description,
            boolean active,
            Integer rateLimit,
            Integer violationThreshold,
            Integer violationWindowSeconds,
            Integer blockDurationSeconds,
            Integer usageThresholdPercent,
            String upstreamUrl,
            String createdAt,
            long subscribers,
            boolean isMockedApi,
            Long originalApiId
    ) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.version = version;
        this.description = description;
        this.active = active;
        this.rateLimit = rateLimit;
        this.violationThreshold = violationThreshold;
        this.violationWindowSeconds = violationWindowSeconds;
        this.blockDurationSeconds = blockDurationSeconds;
        this.usageThresholdPercent = usageThresholdPercent;
        this.upstreamUrl = upstreamUrl;
        this.createdAt = createdAt;
        this.subscribers = subscribers;
        this.isMockedApi = isMockedApi;
        this.originalApiId = originalApiId;
    }

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

    public String getUpstreamUrl() {
        return upstreamUrl;
    }

    public void setUpstreamUrl(String upstreamUrl) {
        this.upstreamUrl = upstreamUrl;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public long getSubscribers() {
        return subscribers;
    }

    public void setSubscribers(long subscribers) {
        this.subscribers = subscribers;
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
