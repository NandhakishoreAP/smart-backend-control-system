package com.smartbackend.smart_control_system.dto;

import java.util.List;

public class ProviderDashboardResponse {

    private long totalApis;
    private long totalSubscribers;
    private long requests24h;
    private double errorRate;
    private double avgLatency;
    private long rateLimitViolations24h;
    private List<ProviderApiStatsResponse> apiStats;

    public ProviderDashboardResponse() {}

    public ProviderDashboardResponse(
            long totalApis,
            long totalSubscribers,
            long requests24h,
            double errorRate,
            double avgLatency,
            long rateLimitViolations24h,
            List<ProviderApiStatsResponse> apiStats
    ) {
        this.totalApis = totalApis;
        this.totalSubscribers = totalSubscribers;
        this.requests24h = requests24h;
        this.errorRate = errorRate;
        this.avgLatency = avgLatency;
        this.rateLimitViolations24h = rateLimitViolations24h;
        this.apiStats = apiStats;
    }

    public long getTotalApis() {
        return totalApis;
    }

    public void setTotalApis(long totalApis) {
        this.totalApis = totalApis;
    }

    public long getTotalSubscribers() {
        return totalSubscribers;
    }

    public void setTotalSubscribers(long totalSubscribers) {
        this.totalSubscribers = totalSubscribers;
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

    public List<ProviderApiStatsResponse> getApiStats() {
        return apiStats;
    }

    public void setApiStats(List<ProviderApiStatsResponse> apiStats) {
        this.apiStats = apiStats;
    }
}
