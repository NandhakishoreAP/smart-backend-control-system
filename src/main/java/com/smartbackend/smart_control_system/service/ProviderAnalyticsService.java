package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.ProviderApiStatsResponse;
import com.smartbackend.smart_control_system.dto.ProviderDashboardResponse;
import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.repository.ApiRepository;
import com.smartbackend.smart_control_system.repository.ApiRequestLogRepository;
import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProviderAnalyticsService {

    private final ApiRepository apiRepository;
    private final ApiSubscriptionRepository subscriptionRepository;
    private final ApiRequestLogRepository requestLogRepository;

    public ProviderAnalyticsService(ApiRepository apiRepository,
                                    ApiSubscriptionRepository subscriptionRepository,
                                    ApiRequestLogRepository requestLogRepository) {
        this.apiRepository = apiRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.requestLogRepository = requestLogRepository;
    }


    public ProviderDashboardResponse getProviderDashboard(Long providerId) {
        List<Api> apis = apiRepository.findByProvider_Id(providerId);
        List<ProviderApiStatsResponse> stats = new ArrayList<>();

        long totalSubscribers = 0;
        long totalRequests = 0;
        long totalErrors = 0;
        long totalRateViolations = 0;
        double weightedLatencySum = 0;

        LocalDateTime since = LocalDateTime.now().minusHours(24);

        for (Api api : apis) {
            String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
            String endpointLike = "/gateway/" + api.getSlug() + "/" + version + "%";

            long subscribers = subscriptionRepository.countByApi_Id(api.getId());
            long requests = requestLogRepository.countSinceAndEndpointLike(since, endpointLike);
            long errors = requestLogRepository.countErrorSinceAndEndpointLike(since, endpointLike);
            double avgLatency = requestLogRepository.averageLatencySinceAndEndpointLike(since, endpointLike);
            long rateViolations = requestLogRepository.countStatusSinceAndEndpointLike(since, 429, endpointLike);

            double errorRate = requests == 0 ? 0 : (errors * 100.0) / requests;

            stats.add(new ProviderApiStatsResponse(
                    api.getId(),
                    api.getName(),
                    api.getSlug(),
                    version,
                    subscribers,
                    requests,
                    errorRate,
                    avgLatency,
                    rateViolations
            ));

            totalSubscribers += subscribers;
            totalRequests += requests;
            totalErrors += errors;
            totalRateViolations += rateViolations;
            weightedLatencySum += avgLatency * requests;
        }

        double avgLatency = totalRequests == 0 ? 0 : weightedLatencySum / totalRequests;
        double errorRate = totalRequests == 0 ? 0 : (totalErrors * 100.0) / totalRequests;

        return new ProviderDashboardResponse(
                apis.size(),
                totalSubscribers,
                totalRequests,
                errorRate,
                avgLatency,
                totalRateViolations,
                stats
        );
    }
    public List<com.smartbackend.smart_control_system.dto.ProviderSubscriberInsightResponse> getProviderSubscriberInsights(Long providerId) {
        return subscriptionRepository.findSubscriberInsightsByProviderId(providerId);
    }
    }
