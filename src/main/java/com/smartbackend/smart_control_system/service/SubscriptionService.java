package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.ApiSubscriptionResponse;
import com.smartbackend.smart_control_system.entity.*;
import com.smartbackend.smart_control_system.entity.NotificationType;
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
    private final NotificationService notificationService;

    public SubscriptionService(ApiSubscriptionRepository subscriptionRepository,
                               ApiRepository apiRepository,
                               UserRepository userRepository,
                               NotificationService notificationService) {

        this.subscriptionRepository = subscriptionRepository;
        this.apiRepository = apiRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
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
        ApiSubscription saved = subscriptionRepository.save(subscription);

        String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
        String apiLabel = api.getName() + " (" + version + ")";
        String basePath = api.getBasePath() == null ? ("/" + api.getSlug() + "/" + version) : api.getBasePath();

        notificationService.createNotification(
            "You are now subscribed to " + apiLabel + ".\n"
                + "Base path: " + basePath + "\n"
                + "Rate limit: " + api.getRateLimit() + " rpm\n"
                + "You can manage this subscription in your dashboard.",
            NotificationType.INFO,
            user
        );

        if (api.getProvider() != null) {
            notificationService.createNotification(
            user.getName() + " subscribed to " + apiLabel + ".\n"
                + "Subscriber email: " + user.getEmail() + "\n"
                + "Base path: " + basePath,
            NotificationType.INFO,
                api.getProvider()
            );
        }

        return convertToResponse(saved);
    }

    public List<ApiSubscriptionResponse> getUserSubscriptions(Long userId) {
        return subscriptionRepository.findByConsumer_Id(userId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public void unsubscribe(Long subscriptionId) {
        ApiSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        Api api = subscription.getApi();
        User consumer = subscription.getConsumer();
        String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
        String apiLabel = api.getName() + " (" + version + ")";

        subscriptionRepository.deleteById(subscriptionId);

        notificationService.createNotification(
            "Your subscription to " + apiLabel + " has been canceled.\n"
                + "You can re-subscribe anytime from the marketplace.",
            NotificationType.INFO,
            consumer
        );

        if (api.getProvider() != null) {
            notificationService.createNotification(
                    consumer.getName() + " unsubscribed from " + apiLabel + ".",
                    NotificationType.INFO,
                    api.getProvider()
            );
        }
    }

    public ApiSubscriptionResponse convertToResponse(ApiSubscription subscription) {
        Api api = subscription.getApi();
        String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
        return new ApiSubscriptionResponse(
                subscription.getId(),
                api.getId(),
                api.getName(),
            api.getSlug(),
            version,
                api.getDescription(),
                subscription.getSubscribedAt()
        );
    }
}