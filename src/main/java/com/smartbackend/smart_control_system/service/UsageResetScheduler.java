package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.ApiSubscription;
import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.entity.ResetInterval;
import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class UsageResetScheduler {

    private final ApiSubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;
    private final RateLimitService rateLimitService;

    public UsageResetScheduler(ApiSubscriptionRepository subscriptionRepository,
                               NotificationService notificationService,
                               RateLimitService rateLimitService) {
        this.subscriptionRepository = subscriptionRepository;
        this.notificationService = notificationService;
        this.rateLimitService = rateLimitService;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void resetDailyUsage() {
        rateLimitService.resetUsageCounters();

        List<ApiSubscription> subscriptions = subscriptionRepository.findAll();
        for (ApiSubscription subscription : subscriptions) {
            Api api = subscription.getApi();
            if (api == null || api.getResetInterval() != ResetInterval.DAILY) {
                continue;
            }
            String message = "Your API usage has been reset for " + api.getName() + ". You can now continue using the API.";
            notificationService.createNotification(message, NotificationType.INFO, subscription.getConsumer());
        }
    }
}