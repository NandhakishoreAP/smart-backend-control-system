package com.smartbackend.smart_control_system.dto;

public class AnalyticsDashboardResponse {

    private long requests24h;
    private double errorRate;
    private long avgLatency;
    private long activeApis;

    public AnalyticsDashboardResponse(long requests24h, double errorRate, long avgLatency, long activeApis) {
        this.requests24h = requests24h;
        this.errorRate = errorRate;
        this.avgLatency = avgLatency;
        this.activeApis = activeApis;
    }

    public long getRequests24h() { return requests24h; }
    public double getErrorRate() { return errorRate; }
    public long getAvgLatency() { return avgLatency; }
    public long getActiveApis() { return activeApis; }
}
