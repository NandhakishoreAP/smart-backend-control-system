package com.smartbackend.smart_control_system.dto;

import java.util.List;

public class ProviderApiHealthResponse {

    private String apiName;
    private String version;
    private String status;
    private long latency;
    private List<Integer> latencyHistory;

    public ProviderApiHealthResponse() {}

    public ProviderApiHealthResponse(String apiName, String version, String status, long latency, List<Integer> latencyHistory) {
        this.apiName = apiName;
        this.version = version;
        this.status = status;
        this.latency = latency;
        this.latencyHistory = latencyHistory;
    }

    public String getApiName() {
        return apiName;
    }

    public void setApiName(String apiName) {
        this.apiName = apiName;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getLatency() {
        return latency;
    }

    public void setLatency(long latency) {
        this.latency = latency;
    }

    public List<Integer> getLatencyHistory() {
        return latencyHistory;
    }

    public void setLatencyHistory(List<Integer> latencyHistory) {
        this.latencyHistory = latencyHistory;
    }
}
