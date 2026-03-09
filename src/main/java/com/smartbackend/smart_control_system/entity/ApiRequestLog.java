    package com.smartbackend.smart_control_system.entity;

    import jakarta.persistence.*;
    import java.time.LocalDateTime;

    @Entity
    @Table(name = "api_request_logs")
    public class ApiRequestLog {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String apiKey;

        private String endpoint;

        private String method;

        private int status;

        private long latency;

        private LocalDateTime timestamp;

        public ApiRequestLog() {}

        public ApiRequestLog(String apiKey, String endpoint, String method, int status, long latency) {
            this.apiKey = apiKey;
            this.endpoint = endpoint;
            this.method = method;
            this.status = status;
            this.latency = latency;
            this.timestamp = LocalDateTime.now();
        }

        public Long getId() { return id; }

        public String getApiKey() { return apiKey; }

        public String getEndpoint() { return endpoint; }

        public String getMethod() { return method; }

        public int getStatus() { return status; }

        public long getLatency() { return latency; }

        public LocalDateTime getTimestamp() { return timestamp; }
    }