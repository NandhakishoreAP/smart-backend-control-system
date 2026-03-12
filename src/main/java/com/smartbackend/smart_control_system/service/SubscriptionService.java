package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.entity.*;
import com.smartbackend.smart_control_system.repository.*;

import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.cache.annotation.Cacheable;

@Service
public class SubscriptionService {

    private final ApiSubscriptionRepository subscriptionRepository;
    private final ApiRepository apiRepository;
    private final UserRepository userRepository;

    public SubscriptionService(ApiSubscriptionRepository subscriptionRepository,
                               ApiRepository apiRepository,
                               UserRepository userRepository) {

        this.subscriptionRepository = subscriptionRepository;
        this.apiRepository = apiRepository;
        this.userRepository = userRepository;
    }

    @Cacheable(value = "subscriptions", key = "#userId + '-' + #apiId")
public boolean isSubscribed(Long userId, Long apiId) {

    return subscriptionRepository
            .existsByConsumer_IdAndApi_Id(userId, apiId);
}

    public ApiSubscription subscribe(Long userId, Long apiId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Api api = apiRepository.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API not found"));

        ApiSubscription subscription = new ApiSubscription(user, api);

        return subscriptionRepository.save(subscription);
    }

    public List<ApiSubscription> getUserSubscriptions(Long userId) {

        return subscriptionRepository.findByConsumer_Id(userId);
    }
}