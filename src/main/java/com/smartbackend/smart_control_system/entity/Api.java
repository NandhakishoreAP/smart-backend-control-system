package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "apis")
public class Api {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    public Api() {
        this.createdAt = LocalDateTime.now();
    }

    public Api(String name, String description, User owner) {
        this.name = name;
        this.description = description;
        this.owner = owner;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getName() { return name; }

    public String getDescription() { return description; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public User getOwner() { return owner; }

    public void setName(String name) { this.name = name; }

    public void setDescription(String description) { this.description = description; }

    public void setOwner(User owner) { this.owner = owner; }
}