package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.AnalyticsDashboardResponse;
import com.smartbackend.smart_control_system.dto.ConsumerDashboardResponse;
import com.smartbackend.smart_control_system.dto.ConsumerEndpointStatsResponse;
import com.smartbackend.smart_control_system.dto.UsageStatsResponse;
import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.ApiKey;
import com.smartbackend.smart_control_system.entity.ApiSubscription;
import com.smartbackend.smart_control_system.entity.ApiRequestLog;
import com.smartbackend.smart_control_system.repository.ApiKeyRepository;
import com.smartbackend.smart_control_system.repository.ApiRequestLogRepository;
import com.smartbackend.smart_control_system.repository.ApiRepository;
import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ApiAnalyticsService {

    private final ApiRequestLogRepository logRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApiRepository apiRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final ApiSubscriptionRepository subscriptionRepository;

    public ApiAnalyticsService(ApiRequestLogRepository logRepository,
                               SimpMessagingTemplate messagingTemplate,
                               ApiRepository apiRepository,
                               ApiKeyRepository apiKeyRepository,
                               ApiSubscriptionRepository subscriptionRepository) {
        this.logRepository = logRepository;
        this.messagingTemplate = messagingTemplate;
        this.apiRepository = apiRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    public void logRequest(String apiKey,
                           String endpoint,
                           String method,
                           int status,
                           long latency) {

        ApiRequestLog log = new ApiRequestLog(
                apiKey,
                endpoint,
                method,
                status,
                latency
        );

        ApiRequestLog savedLog = logRepository.save(log);

        messagingTemplate.convertAndSend(
                "/topic/api-monitor",
                savedLog
        );
    }

    public List<ApiRequestLog> getAllLogs() {
        return logRepository.findAll();
    }

    public List<ApiRequestLog> getLogsByApiKey(String apiKey) {
        return logRepository.findByApiKey(apiKey);
    }

    public List<Map<String,Object>> getTopEndpoints(){

        List<Object[]> results = logRepository.findTopEndpoints();

        List<Map<String,Object>> response = new ArrayList<>();

        for(Object[] row : results){

            Map<String,Object> data = new HashMap<>();

            data.put("endpoint", row[0]);
            data.put("count", row[1]);

            response.add(data);
        }

        return response;
    }

    public List<Map<String,Object>> getTrafficStats(){

    List<Object[]> results = logRepository.getTrafficStats();

    List<Map<String,Object>> response = new ArrayList<>();

    for(Object[] row : results){

        Map<String,Object> data = new HashMap<>();

        data.put("endpoint", row[0]);
        data.put("requests", row[1]);

        response.add(data);
    }

    return response;
    }

    public List<Map<String,Object>> getTopApiConsumers(){

    List<Object[]> results = logRepository.findTopApiConsumers();

    List<Map<String,Object>> response = new ArrayList<>();

    for(Object[] row : results){

        Map<String,Object> data = new HashMap<>();

        data.put("apiKey", row[0]);
        data.put("requests", row[1]);

        response.add(data);
    }

    return response;
    }

    public AnalyticsDashboardResponse getDashboardMetrics() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long totalRequests = logRepository.countSince(since);
        long errorRequests = logRepository.countErrorSince(since);
        double errorRate = totalRequests == 0 ? 0.0 : (errorRequests * 100.0) / totalRequests;
        long avgLatency = Math.round(logRepository.averageLatencySince(since));
        long activeApis = apiRepository.countByActiveTrue();

        return new AnalyticsDashboardResponse(totalRequests, errorRate, avgLatency, activeApis);
    }

    public ConsumerDashboardResponse getConsumerDashboard(String apiKey) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long totalRequests = logRepository.countSinceAndApiKey(since, apiKey);
        long errorRequests = logRepository.countErrorSinceAndApiKey(since, apiKey);
        double errorRate = totalRequests == 0 ? 0.0 : (errorRequests * 100.0) / totalRequests;
        long avgLatency = Math.round(logRepository.averageLatencySinceAndApiKey(since, apiKey));
        long activeApis = logRepository.countDistinctEndpointsSinceAndApiKey(since, apiKey);
        List<ApiRequestLog> recentLogs = logRepository.findTop20ByApiKeyOrderByTimestampDesc(apiKey);

        return new ConsumerDashboardResponse(totalRequests, errorRate, avgLatency, activeApis, recentLogs);
    }

    public List<ConsumerEndpointStatsResponse> getConsumerEndpointStats(String apiKey) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Object[]> rows = logRepository.getEndpointStatsSinceAndApiKey(since, apiKey);
        List<ConsumerEndpointStatsResponse> results = new ArrayList<>();

        for (Object[] row : rows) {
            String endpoint = String.valueOf(row[0]);
            long requests = ((Number) row[1]).longValue();
            long errorCount = ((Number) row[2]).longValue();
            long avgLatency = Math.round(((Number) row[3]).doubleValue());
            double errorRate = requests == 0 ? 0.0 : (errorCount * 100.0) / requests;
            results.add(new ConsumerEndpointStatsResponse(endpoint, requests, errorRate, avgLatency));
        }

        return results;
    }

    public List<UsageStatsResponse> getUsageByUser(Long userId) {
        Optional<ApiKey> apiKeyOptional = apiKeyRepository
                .findTopByUser_IdAndActiveTrueOrderByCreatedAtDesc(userId);

        if (apiKeyOptional.isEmpty()) {
            return Collections.emptyList();
        }

        String apiKey = apiKeyOptional.get().getApiKey();
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<ApiSubscription> subscriptions = subscriptionRepository.findByConsumer_Id(userId);
        List<UsageStatsResponse> results = new ArrayList<>();

        for (ApiSubscription subscription : subscriptions) {
            Api api = subscription.getApi();
            String slug = api.getSlug();
            String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
            String endpointPrefix = "/gateway/" + slug + "/" + version + "%";
            long requestsMade = logRepository.countSinceAndApiKeyAndEndpointLike(
                    since,
                    apiKey,
                    endpointPrefix
            );
            long totalLimit = api.getRateLimit();
            results.add(new UsageStatsResponse(api.getId(), api.getName(), requestsMade, totalLimit));
        }

        return results;
    }
}