package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.ApiSubscriptionResponse;
import com.smartbackend.smart_control_system.entity.*;
import com.smartbackend.smart_control_system.repository.*;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
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

    public ApiSubscriptionResponse subscribe(Long userId, Long apiId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Api api = apiRepository.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API not found"));

        ApiSubscription existing = subscriptionRepository
                .findByConsumer_IdAndApi_Id(userId, apiId)
                .orElse(null);

        if (existing != null) {
            return convertToResponse(existing);
        }

        ApiSubscription subscription = new ApiSubscription(user, api);

        return convertToResponse(subscriptionRepository.save(subscription));
    }

    public List<ApiSubscriptionResponse> getUserSubscriptions(Long userId) {
        return subscriptionRepository.findByConsumer_Id(userId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public void unsubscribe(Long subscriptionId) {
        if (!subscriptionRepository.existsById(subscriptionId)) {
            throw new RuntimeException("Subscription not found");
        }
        subscriptionRepository.deleteById(subscriptionId);
    }

    public ApiSubscriptionResponse convertToResponse(ApiSubscription subscription) {
        Api api = subscription.getApi();
        return new ApiSubscriptionResponse(
                subscription.getId(),
                api.getId(),
                api.getName(),
                api.getDescription(),
                subscription.getSubscribedAt()
        );
    }
}