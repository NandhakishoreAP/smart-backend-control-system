package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.AnalyticsDashboardResponse;
import com.smartbackend.smart_control_system.entity.ApiRequestLog;
import com.smartbackend.smart_control_system.repository.ApiRequestLogRepository;
import com.smartbackend.smart_control_system.repository.ApiRepository;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ApiAnalyticsService {

    private final ApiRequestLogRepository logRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApiRepository apiRepository;

    public ApiAnalyticsService(ApiRequestLogRepository logRepository,
                               SimpMessagingTemplate messagingTemplate,
                               ApiRepository apiRepository) {
        this.logRepository = logRepository;
        this.messagingTemplate = messagingTemplate;
        this.apiRepository = apiRepository;
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
}