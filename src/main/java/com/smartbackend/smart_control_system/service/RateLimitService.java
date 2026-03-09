package com.smartbackend.smart_control_system.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_SECONDS = 60;

    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> windowStart = new ConcurrentHashMap<>();

    public boolean isRateLimited(String clientKey) {

        long now = Instant.now().getEpochSecond();

        windowStart.putIfAbsent(clientKey, now);

        if (now - windowStart.get(clientKey) > WINDOW_SECONDS) {

            requestCounts.put(clientKey, 0);
            windowStart.put(clientKey, now);
        }

        requestCounts.put(clientKey,
                requestCounts.getOrDefault(clientKey, 0) + 1);

        return requestCounts.get(clientKey) > MAX_REQUESTS;
    }
}