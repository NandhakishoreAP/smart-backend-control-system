package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String apiKey;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private boolean active = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    public ApiKey() {}

    public ApiKey(String apiKey, User user) {
        this.apiKey = apiKey;
        this.user = user;
    }

    public Long getId() { return id; }

    public String getApiKey() { return apiKey; }

    public User getUser() { return user; }

    public boolean isActive() { return active; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setActive(boolean active) { this.active = active; }
}