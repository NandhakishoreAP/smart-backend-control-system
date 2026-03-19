package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_health_logs")
public class ApiHealthLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "api_id")
    private Api api;

    private String status;

    private long latency;

    private LocalDateTime timestamp;

    public ApiHealthLog() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiHealthLog(Api api, String status, long latency) {
        this.api = api;
        this.status = status;
        this.latency = latency;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Api getApi() {
        return api;
    }

    public void setApi(Api api) {
        this.api = api;
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
