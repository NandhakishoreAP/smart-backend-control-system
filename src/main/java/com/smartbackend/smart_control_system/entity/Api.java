package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "apis", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"slug", "version"})
})
public class Api {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    @Column(unique = true)
    private String basePath;

    private String slug;

    private String version;

    @Column(name = "upstream_url")
    private String upstreamUrl;

    private int rateLimit;

    @Column(name = "violation_threshold")
    private Integer violationThreshold;

    @Column(name = "violation_window_seconds")
    private Integer violationWindowSeconds;

    @Column(name = "block_duration_seconds")
    private Integer blockDurationSeconds;

    @Column(name = "usage_threshold_percent")
    private Integer usageThresholdPercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "reset_interval")
    private ResetInterval resetInterval;

    private boolean active;

    @Column(name = "is_mock_response_enabled")
    private Boolean isMockResponseEnabled;

    @Column(name = "mock_response_body", columnDefinition = "TEXT")
    private String mockResponseBody;

    @Column(name = "mock_response_status")
    private Integer mockResponseStatus;

    @Column(name = "is_mocked_api")
    private Boolean isMockedApi;

    @Column(name = "original_api_id")
    private Long originalApiId;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "provider_id")
    private User provider;

    public Api() {
        this.createdAt = LocalDateTime.now();
        this.active = true;
        this.version = "v1";
        this.violationThreshold = 3;
        this.violationWindowSeconds = 300;
        this.blockDurationSeconds = 900;
        this.usageThresholdPercent = 80;
        this.resetInterval = ResetInterval.DAILY;
    }

    // ---------- GETTERS & SETTERS ----------

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBasePath() {
        return basePath;
    }

    public void setBasePath(String basePath) {
        this.basePath = basePath;
    }

    // -------- SLUG GETTER & SETTER --------

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    // -------- VERSION --------

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    // -------- UPSTREAM URL --------

    public String getUpstreamUrl() {
        return upstreamUrl;
    }

    public void setUpstreamUrl(String upstreamUrl) {
        this.upstreamUrl = upstreamUrl;
    }

    // -------- RATE LIMIT --------

    public int getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(int rateLimit) {
        this.rateLimit = rateLimit;
    }

    public Integer getViolationThreshold() {
        return violationThreshold;
    }

    public void setViolationThreshold(Integer violationThreshold) {
        this.violationThreshold = violationThreshold;
    }

    public Integer getViolationWindowSeconds() {
        return violationWindowSeconds;
    }

    public void setViolationWindowSeconds(Integer violationWindowSeconds) {
        this.violationWindowSeconds = violationWindowSeconds;
    }

    public Integer getBlockDurationSeconds() {
        return blockDurationSeconds;
    }

    public void setBlockDurationSeconds(Integer blockDurationSeconds) {
        this.blockDurationSeconds = blockDurationSeconds;
    }

    public Integer getUsageThresholdPercent() {
        return usageThresholdPercent;
    }

    public void setUsageThresholdPercent(Integer usageThresholdPercent) {
        this.usageThresholdPercent = usageThresholdPercent;
    }

    public ResetInterval getResetInterval() {
        return resetInterval;
    }

    public void setResetInterval(ResetInterval resetInterval) {
        this.resetInterval = resetInterval;
    }

    // -------- ACTIVE --------

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // -------- MOCK RESPONSE --------

    public Boolean isMockResponseEnabled() {
        return isMockResponseEnabled != null && isMockResponseEnabled;
    }

    public void setMockResponseEnabled(Boolean mockResponseEnabled) {
        isMockResponseEnabled = mockResponseEnabled;
    }

    public String getMockResponseBody() {
        return mockResponseBody;
    }

    public void setMockResponseBody(String mockResponseBody) {
        this.mockResponseBody = mockResponseBody;
    }

    public Integer getMockResponseStatus() {
        return mockResponseStatus;
    }

    public void setMockResponseStatus(Integer mockResponseStatus) {
        this.mockResponseStatus = mockResponseStatus;
    }

    // -------- MOCK API DETAILS --------

    public Boolean isMockedApi() {
        return isMockedApi != null && isMockedApi;
    }

    public void setMockedApi(Boolean mockedApi) {
        isMockedApi = mockedApi;
    }

    public Long getOriginalApiId() {
        return originalApiId;
    }

    public void setOriginalApiId(Long originalApiId) {
        this.originalApiId = originalApiId;
    }

    // -------- CREATED AT --------

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // -------- PROVIDER --------

    public User getProvider() {
        return provider;
    }

    public void setProvider(User provider) {
        this.provider = provider;
    }
}