package com.smartbackend.smart_control_system.util;

import com.smartbackend.smart_control_system.entity.ApiSubscription;
import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
public class ApiSubscriptionKeyMigration implements CommandLineRunner {
    private final ApiSubscriptionRepository subscriptionRepository;

    public ApiSubscriptionKeyMigration(ApiSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (ApiSubscription sub : subscriptionRepository.findAll()) {
            if (sub.getApiKey() == null || sub.getApiKey().isBlank()) {
                sub.setApiKey(UUID.randomUUID().toString());
                subscriptionRepository.save(sub);
            }
        }
    }
}
