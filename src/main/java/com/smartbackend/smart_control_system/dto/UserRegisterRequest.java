package com.smartbackend.smart_control_system.dto;

import com.smartbackend.smart_control_system.entity.UserRole;

public class UserRegisterRequest {

    private String name;
    private String email;
    private String password;
    private UserRole role;

    public UserRegisterRequest() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}