package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.entity.ApiRequestLog;
import com.smartbackend.smart_control_system.repository.ApiRequestLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.*;

@Service
public class ApiAnalyticsService {

    private final ApiRequestLogRepository logRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ApiAnalyticsService(ApiRequestLogRepository logRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.logRepository = logRepository;
        this.messagingTemplate = messagingTemplate;
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
}