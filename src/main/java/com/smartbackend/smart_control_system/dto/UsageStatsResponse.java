package com.smartbackend.smart_control_system.dto;

public class UsageStatsResponse {

    private final Long apiId;
    private final String apiName;
    private final long requestsMade;
    private final long totalLimit;

    public UsageStatsResponse(Long apiId, String apiName, long requestsMade, long totalLimit) {
        this.apiId = apiId;
        this.apiName = apiName;
        this.requestsMade = requestsMade;
        this.totalLimit = totalLimit;
    }

    public Long getApiId() {
        return apiId;
    }

    public String getApiName() {
        return apiName;
    }

    public long getRequestsMade() {
        return requestsMade;
    }

    public long getTotalLimit() {
        return totalLimit;
    }
}
