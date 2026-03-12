package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.entity.ApiSubscription;
import com.smartbackend.smart_control_system.service.SubscriptionService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/subscribe")
    public ApiSubscription subscribe(
            @RequestParam Long userId,
            @RequestParam Long apiId
    ) {

        return subscriptionService.subscribe(userId, apiId);
    }

    @GetMapping("/user/{userId}")
    public List<ApiSubscription> getUserSubscriptions(
            @PathVariable Long userId
    ) {

        return subscriptionService.getUserSubscriptions(userId);
    }
}