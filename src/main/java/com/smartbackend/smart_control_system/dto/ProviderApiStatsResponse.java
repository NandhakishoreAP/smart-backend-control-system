package com.smartbackend.smart_control_system.dto;

public class ProviderApiStatsResponse {

    private Long apiId;
    private String name;
    private String slug;
    private String version;
    private long subscribers;
    private long requests24h;
    private double errorRate;
    private double avgLatency;
    private long rateLimitViolations24h;

    public ProviderApiStatsResponse() {}

    public ProviderApiStatsResponse(
            Long apiId,
            String name,
            String slug,
            String version,
            long subscribers,
            long requests24h,
            double errorRate,
            double avgLatency,
            long rateLimitViolations24h
    ) {
        this.apiId = apiId;
        this.name = name;
        this.slug = slug;
        this.version = version;
        this.subscribers = subscribers;
        this.requests24h = requests24h;
        this.errorRate = errorRate;
        this.avgLatency = avgLatency;
        this.rateLimitViolations24h = rateLimitViolations24h;
    }

    public Long getApiId() {
        return apiId;
    }

    public void setApiId(Long apiId) {
        this.apiId = apiId;
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

    public long getSubscribers() {
        return subscribers;
    }

    public void setSubscribers(long subscribers) {
        this.subscribers = subscribers;
    }

    public long getRequests24h() {
        return requests24h;
    }

    public void setRequests24h(long requests24h) {
        this.requests24h = requests24h;
    }

    public double getErrorRate() {
        return errorRate;
    }

    public void setErrorRate(double errorRate) {
        this.errorRate = errorRate;
    }

    public double getAvgLatency() {
        return avgLatency;
    }

    public void setAvgLatency(double avgLatency) {
        this.avgLatency = avgLatency;
    }

    public long getRateLimitViolations24h() {
        return rateLimitViolations24h;
    }

    public void setRateLimitViolations24h(long rateLimitViolations24h) {
        this.rateLimitViolations24h = rateLimitViolations24h;
    }
}
