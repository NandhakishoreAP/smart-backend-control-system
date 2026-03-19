package com.smartbackend.smart_control_system.dto;

import com.smartbackend.smart_control_system.entity.ApiRequestLog;

import java.util.List;

public class ConsumerDashboardResponse {

    private final long requests24h;
    private final double errorRate;
    private final long avgLatency;
    private final long activeApis;
    private final List<ApiRequestLog> recentLogs;

    public ConsumerDashboardResponse(long requests24h,
                                     double errorRate,
                                     long avgLatency,
                                     long activeApis,
                                     List<ApiRequestLog> recentLogs) {
        this.requests24h = requests24h;
        this.errorRate = errorRate;
        this.avgLatency = avgLatency;
        this.activeApis = activeApis;
        this.recentLogs = recentLogs;
    }

    public long getRequests24h() {
        return requests24h;
    }

    public double getErrorRate() {
        return errorRate;
    }

    public long getAvgLatency() {
        return avgLatency;
    }

    public long getActiveApis() {
        return activeApis;
    }

    public List<ApiRequestLog> getRecentLogs() {
        return recentLogs;
    }
}
