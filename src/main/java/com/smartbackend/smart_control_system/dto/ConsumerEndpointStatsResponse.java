package com.smartbackend.smart_control_system.dto;

public class ConsumerEndpointStatsResponse {

    private final String endpoint;
    private final long requests;
    private final double errorRate;
    private final long avgLatency;

    public ConsumerEndpointStatsResponse(String endpoint,
                                         long requests,
                                         double errorRate,
                                         long avgLatency) {
        this.endpoint = endpoint;
        this.requests = requests;
        this.errorRate = errorRate;
        this.avgLatency = avgLatency;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public long getRequests() {
        return requests;
    }

    public double getErrorRate() {
        return errorRate;
    }

    public long getAvgLatency() {
        return avgLatency;
    }
}
