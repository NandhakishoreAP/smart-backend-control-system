package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "api_endpoints")
public class ApiEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String path;

    private String httpMethod;

    private String description;

    @ManyToOne
    @JoinColumn(name = "api_id")
    private Api api;

    public ApiEndpoint() {}

    public ApiEndpoint(String path, String httpMethod, String description, Api api) {
        this.path = path;
        this.httpMethod = httpMethod;
        this.description = description;
        this.api = api;
    }

    public Long getId() { return id; }

    public String getPath() { return path; }

    public String getHttpMethod() { return httpMethod; }

    public String getDescription() { return description; }

    public Api getApi() { return api; }

    public void setPath(String path) { this.path = path; }

    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }

    public void setDescription(String description) { this.description = description; }

    public void setApi(Api api) { this.api = api; }
}