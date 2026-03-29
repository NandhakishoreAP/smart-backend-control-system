package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.ProviderApiHealthResponse;
import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.ApiHealthLog;
import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.repository.ApiHealthLogRepository;
import com.smartbackend.smart_control_system.repository.ApiRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class ApiHealthService {

    private static final long SLOW_THRESHOLD_MS = 300;
    private static final int RETENTION_DAYS = 7;
    private final ApiRepository apiRepository;
    private final ApiHealthLogRepository apiHealthLogRepository;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<Long, String> lastStatuses = new ConcurrentHashMap<>();

    public ApiHealthService(ApiRepository apiRepository,
                            ApiHealthLogRepository apiHealthLogRepository,
                            NotificationService notificationService) {
        this.apiRepository = apiRepository;
        this.apiHealthLogRepository = apiHealthLogRepository;
        this.notificationService = notificationService;
    }

    public List<ProviderApiHealthResponse> getProviderHealth(Long providerId) {
        List<Api> apis = apiRepository.findByProvider_Id(providerId);
        List<ProviderApiHealthResponse> results = new ArrayList<>();

        for (Api api : apis) {
            String upstreamUrl = api.getUpstreamUrl();
            long latency = 0;
            String status = "DOWN";

            if (upstreamUrl != null && !upstreamUrl.isBlank()) {
                long start = System.nanoTime();
                try {
                    ResponseEntity<String> response = restTemplate.getForEntity(upstreamUrl, String.class);
                    latency = Math.max(0, (System.nanoTime() - start) / 1_000_000);
                    if (response.getStatusCode().is2xxSuccessful()) {
                        status = latency > SLOW_THRESHOLD_MS ? "SLOW" : "UP";
                    } else {
                        status = "DOWN";
                    }
                } catch (Exception ex) {
                    latency = 0;
                    status = "DOWN";
                }
            }

            String previousStatus = lastStatuses.get(api.getId());
            lastStatuses.put(api.getId(), status);

            if (previousStatus != null && !previousStatus.equals(status)) {
                if ("DOWN".equals(status)) {
                    notifyProvider(api, NotificationType.ERROR, api.getName() + " is DOWN.");
                } else if ("DOWN".equals(previousStatus) && "UP".equals(status)) {
                    notifyProvider(api, NotificationType.INFO, api.getName() + " is back UP.");
                }
            }

            apiHealthLogRepository.save(new ApiHealthLog(api, status, latency));
            List<Integer> history = loadLatencyHistory(api.getId());
            String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
            results.add(new ProviderApiHealthResponse(api.getName(), version, status, latency, history));
        }

        return results;
    }

    @Scheduled(fixedDelay = 86_400_000)
    public void cleanupOldHealthLogs() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(RETENTION_DAYS);
        apiHealthLogRepository.deleteByTimestampBefore(threshold);
    }

    private List<Integer> loadLatencyHistory(Long apiId) {
        if (apiId == null) {
            return Collections.emptyList();
        }
        List<ApiHealthLog> logs = apiHealthLogRepository.findTop12ByApi_IdOrderByTimestampDesc(apiId);
        List<Integer> values = new ArrayList<>();
        for (int i = logs.size() - 1; i >= 0; i--) {
            values.add((int) logs.get(i).getLatency());
        }
        return values;
    }

    private void notifyProvider(Api api, NotificationType type, String message) {
        if (api.getProvider() == null) {
            return;
        }
        notificationService.createNotification(message, type, api.getProvider());
    }
}
