package com.smartbackend.smart_control_system.dto;

public class ProviderSubscriberInsightResponse {
    private Long subscriptionId;
    private String subscriberName;
    private String subscriberEmail;
    private String apiName;
    private String apiSlug;
    private String apiVersion;
    private long calls;

    public ProviderSubscriberInsightResponse(Long subscriptionId, String subscriberName, String subscriberEmail, String apiName, String apiSlug, String apiVersion, long calls) {
        this.subscriptionId = subscriptionId;
        this.subscriberName = subscriberName;
        this.subscriberEmail = subscriberEmail;
        this.apiName = apiName;
        this.apiSlug = apiSlug;
        this.apiVersion = apiVersion;
        this.calls = calls;
    }

    public Long getSubscriptionId() { return subscriptionId; }
    public String getSubscriberName() { return subscriberName; }
    public String getSubscriberEmail() { return subscriberEmail; }
    public String getApiName() { return apiName; }
    public String getApiSlug() { return apiSlug; }
    public String getApiVersion() { return apiVersion; }
    public long getCalls() { return calls; }
}
