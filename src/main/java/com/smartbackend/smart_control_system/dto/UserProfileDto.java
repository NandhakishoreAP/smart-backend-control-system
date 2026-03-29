package com.smartbackend.smart_control_system.dto;

public class UserProfileDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String userId;
    private String photo;
    private String company;
    private String address;
    private String dateOfBirth;
    private String role;
    private int totalApis;
    private int totalSubscriptions;
    private String providerId;
    private String consumerId;
    private String subscriptionPlan;

    // Default constructor
    public UserProfileDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public int getTotalApis() { return totalApis; }
    public void setTotalApis(int totalApis) { this.totalApis = totalApis; }

    public int getTotalSubscriptions() { return totalSubscriptions; }
    public void setTotalSubscriptions(int totalSubscriptions) { this.totalSubscriptions = totalSubscriptions; }

    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }

    public String getConsumerId() { return consumerId; }
    public void setConsumerId(String consumerId) { this.consumerId = consumerId; }

    public String getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(String subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }
}
