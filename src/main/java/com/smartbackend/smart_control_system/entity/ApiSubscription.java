package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "api_subscriptions",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"consumer_id", "api_id"})
    }
)
public class ApiSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Consumer (API User)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consumer_id", nullable = false)
    private User consumer;

    // API being subscribed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_id", nullable = false)
    private Api api;

    @Column(name = "subscribed_at", nullable = false)
    private LocalDateTime subscribedAt;

    // ---------- Constructors ----------

    public ApiSubscription() {}

    public ApiSubscription(User consumer, Api api) {
        this.consumer = consumer;
        this.api = api;
        this.subscribedAt = LocalDateTime.now();
    }

    // ---------- Getters ----------

    public Long getId() {
        return id;
    }

    public User getConsumer() {
        return consumer;
    }

    public Api getApi() {
        return api;
    }

    public LocalDateTime getSubscribedAt() {
        return subscribedAt;
    }

    // ---------- Setters ----------

    public void setConsumer(User consumer) {
        this.consumer = consumer;
    }

    public void setApi(Api api) {
        this.api = api;
    }

    public void setSubscribedAt(LocalDateTime subscribedAt) {
        this.subscribedAt = subscribedAt;
    }
}