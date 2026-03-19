package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.AnalyticsDashboardResponse;
import com.smartbackend.smart_control_system.dto.ConsumerDashboardResponse;
import com.smartbackend.smart_control_system.dto.ConsumerEndpointStatsResponse;
import com.smartbackend.smart_control_system.dto.UsageStatsResponse;
import com.smartbackend.smart_control_system.dto.ProviderDashboardResponse;
import com.smartbackend.smart_control_system.entity.ApiRequestLog;
import com.smartbackend.smart_control_system.service.ApiAnalyticsService;
import com.smartbackend.smart_control_system.service.ProviderAnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final ApiAnalyticsService analyticsService;
    private final ProviderAnalyticsService providerAnalyticsService;

    public AnalyticsController(ApiAnalyticsService analyticsService,
                               ProviderAnalyticsService providerAnalyticsService) {
        this.analyticsService = analyticsService;
        this.providerAnalyticsService = providerAnalyticsService;
    }

    @GetMapping("/logs")
    public List<ApiRequestLog> getAllLogs() {
        return analyticsService.getAllLogs();
    }

    @GetMapping("/logs/{apiKey}")
    public List<ApiRequestLog> getLogsByApiKey(@PathVariable String apiKey) {
        return analyticsService.getLogsByApiKey(apiKey);
    }

    @GetMapping("/top-endpoints")
    public List<Map<String,Object>> topEndpoints(){
        return analyticsService.getTopEndpoints();
    }

    @GetMapping("/traffic")
    public List<Map<String,Object>> getTrafficStats(){
    return analyticsService.getTrafficStats();
    }

    @GetMapping("/top-consumers")
    public List<Map<String,Object>> topApiConsumers(){
    return analyticsService.getTopApiConsumers();
    }

    @GetMapping("/dashboard")
    public AnalyticsDashboardResponse dashboard() {
        return analyticsService.getDashboardMetrics();
    }

    @GetMapping("/consumer-dashboard")
    public ConsumerDashboardResponse consumerDashboard(@RequestParam String apiKey) {
        return analyticsService.getConsumerDashboard(apiKey);
    }

    @GetMapping("/consumer-endpoints")
    public List<ConsumerEndpointStatsResponse> consumerEndpoints(@RequestParam String apiKey) {
        return analyticsService.getConsumerEndpointStats(apiKey);
    }

    @GetMapping("/usage/{userId}")
    public List<UsageStatsResponse> usageByUser(@PathVariable Long userId) {
        return analyticsService.getUsageByUser(userId);
    }

    @GetMapping("/provider/{userId}")
    public ProviderDashboardResponse providerAnalytics(@PathVariable Long userId) {
        return providerAnalyticsService.getProviderDashboard(userId);
    }
}