package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.entity.ApiRequestLog;
import com.smartbackend.smart_control_system.service.ApiAnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final ApiAnalyticsService analyticsService;

    public AnalyticsController(ApiAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
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
}