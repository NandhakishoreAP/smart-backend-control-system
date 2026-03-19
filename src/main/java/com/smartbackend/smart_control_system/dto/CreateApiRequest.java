package com.smartbackend.smart_control_system.dto;

public class CreateApiRequest {

    private Long userId;
    private String name;
    private String description;
    private String slug;
    private String version;
    private Integer rateLimit;
    private String upstreamUrl;
    private Boolean active;
    private Integer violationThreshold;
    private Integer violationWindowSeconds;
    private Integer blockDurationSeconds;
    private Integer usageThresholdPercent;
    private String resetInterval;

    public Long getUserId() { return userId; }

    public String getName() { return name; }

    public String getDescription() { return description; }

    public String getSlug() { return slug; }

    public String getVersion() { return version; }

    public Integer getRateLimit() { return rateLimit; }

    public String getUpstreamUrl() { return upstreamUrl; }

    public Boolean getActive() { return active; }

    public Integer getViolationThreshold() { return violationThreshold; }

    public Integer getViolationWindowSeconds() { return violationWindowSeconds; }

    public Integer getBlockDurationSeconds() { return blockDurationSeconds; }

    public Integer getUsageThresholdPercent() { return usageThresholdPercent; }

    public String getResetInterval() { return resetInterval; }

    public void setUserId(Long userId) { this.userId = userId; }

    public void setName(String name) { this.name = name; }

    public void setDescription(String description) { this.description = description; }

    public void setSlug(String slug) { this.slug = slug; }

    public void setVersion(String version) { this.version = version; }

    public void setRateLimit(Integer rateLimit) { this.rateLimit = rateLimit; }

    public void setUpstreamUrl(String upstreamUrl) { this.upstreamUrl = upstreamUrl; }

    public void setActive(Boolean active) { this.active = active; }

    public void setViolationThreshold(Integer violationThreshold) { this.violationThreshold = violationThreshold; }

    public void setViolationWindowSeconds(Integer violationWindowSeconds) { this.violationWindowSeconds = violationWindowSeconds; }

    public void setBlockDurationSeconds(Integer blockDurationSeconds) { this.blockDurationSeconds = blockDurationSeconds; }

    public void setUsageThresholdPercent(Integer usageThresholdPercent) { this.usageThresholdPercent = usageThresholdPercent; }

    public void setResetInterval(String resetInterval) { this.resetInterval = resetInterval; }
}