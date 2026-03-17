package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.ApiSubscriptionResponse;
import com.smartbackend.smart_control_system.service.SubscriptionService;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/subscribe")
        public ApiSubscriptionResponse subscribe(
            @RequestParam Long userId,
            @RequestParam Long apiId
    ) {

        return subscriptionService.subscribe(userId, apiId);
    }

    @GetMapping("/user/{userId}")
        public List<ApiSubscriptionResponse> getUserSubscriptions(
            @PathVariable Long userId
    ) {

        return subscriptionService.getUserSubscriptions(userId);
    }

    @DeleteMapping("/{subscriptionId}")
    public Map<String, String> unsubscribe(@PathVariable Long subscriptionId) {
        subscriptionService.unsubscribe(subscriptionId);
        return Map.of("message", "Unsubscribed successfully");
    }
}