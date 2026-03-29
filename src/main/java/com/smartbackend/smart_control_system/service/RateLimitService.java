package com.smartbackend.smart_control_system.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private static final long REQUEST_WINDOW_SECONDS = 60;

    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> requestWindowStart = new ConcurrentHashMap<>();
    private final Map<String, Integer> violationCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> violationWindowStart = new ConcurrentHashMap<>();
    private final Map<String, Long> blockedUntil = new ConcurrentHashMap<>();
    private final Map<String, Long> thresholdNotifiedAt = new ConcurrentHashMap<>();

    public RateLimitResult checkAndConsume(String key,
                                           int maxRequests,
                                           int usageThresholdPercent,
                                           int violationThreshold,
                                           int violationWindowSeconds,
                                           int blockDurationSeconds) {
        long now = Instant.now().getEpochSecond();

        Long blockUntil = blockedUntil.get(key);
        if (blockUntil != null) {
            if (now < blockUntil) {
                return RateLimitResult.blocked(blockUntil, false);
            }
            blockedUntil.remove(key);
            requestCounts.remove(key);
            violationCounts.remove(key);
            thresholdNotifiedAt.remove(key);
        }

        requestWindowStart.putIfAbsent(key, now);
        if (now - requestWindowStart.get(key) >= REQUEST_WINDOW_SECONDS) {
            requestCounts.put(key, 0);
            requestWindowStart.put(key, now);
            thresholdNotifiedAt.remove(key);
        }

        int nextCount = requestCounts.getOrDefault(key, 0) + 1;
        requestCounts.put(key, nextCount);

        boolean thresholdReached = false;
        if (usageThresholdPercent > 0 && maxRequests > 0) {
            int threshold = (int) Math.ceil(maxRequests * (usageThresholdPercent / 100.0));
            if (nextCount >= threshold && !thresholdNotifiedAt.containsKey(key)) {
                thresholdReached = true;
                thresholdNotifiedAt.put(key, now);
            }
        }

        if (nextCount > maxRequests) {
            violationWindowStart.putIfAbsent(key, now);
            if (now - violationWindowStart.get(key) >= violationWindowSeconds) {
                violationCounts.put(key, 0);
                violationWindowStart.put(key, now);
            }

            int violationCount = violationCounts.getOrDefault(key, 0) + 1;
            violationCounts.put(key, violationCount);

            if (violationThreshold > 0 && violationCount >= violationThreshold && blockDurationSeconds > 0) {
                long until = now + blockDurationSeconds;
                blockedUntil.put(key, until);
                return RateLimitResult.blocked(until, true);
            }

            return RateLimitResult.rateLimited(thresholdReached, nextCount, maxRequests);
        }

        return RateLimitResult.allowed(thresholdReached, nextCount, maxRequests);
    }

    public boolean isRateLimited(String clientKey) {
        RateLimitResult result = checkAndConsume(clientKey, 100, 0, 0, 60, 0);
        return !result.isAllowed();
    }

    public void resetUsageCounters() {
        requestCounts.clear();
        requestWindowStart.clear();
        violationCounts.clear();
        violationWindowStart.clear();
        thresholdNotifiedAt.clear();
    }

    public void clearBlock(String key) {
        blockedUntil.remove(key);
    }

    public static class RateLimitResult {
        private final boolean allowed;
        private final boolean blocked;
        private final boolean unblocked;
        private final boolean thresholdReached;
        private final boolean newlyBlocked;
        private final long blockedUntil;
        private final int currentCount;
        private final int maxRequests;

        private RateLimitResult(boolean allowed,
                                boolean blocked,
                                boolean unblocked,
                                boolean thresholdReached,
                                long blockedUntil,
                                boolean newlyBlocked,
                                int currentCount,
                                int maxRequests) {
            this.allowed = allowed;
            this.blocked = blocked;
            this.unblocked = unblocked;
            this.thresholdReached = thresholdReached;
            this.blockedUntil = blockedUntil;
            this.newlyBlocked = newlyBlocked;
            this.currentCount = currentCount;
            this.maxRequests = maxRequests;
        }

        public static RateLimitResult allowed(boolean thresholdReached, int currentCount, int maxRequests) {
            return new RateLimitResult(true, false, false, thresholdReached, 0, false, currentCount, maxRequests);
        }

        public static RateLimitResult rateLimited(boolean thresholdReached, int currentCount, int maxRequests) {
            return new RateLimitResult(false, false, false, thresholdReached, 0, false, currentCount, maxRequests);
        }

        public static RateLimitResult blocked(long until, boolean newlyBlocked) {
            return new RateLimitResult(false, true, false, false, until, newlyBlocked, 0, 0);
        }

        public static RateLimitResult unblocked() {
            return new RateLimitResult(true, false, true, false, 0, false, 0, 0);
        }

        public boolean isAllowed() {
            return allowed;
        }

        public boolean isBlocked() {
            return blocked;
        }

        public boolean isUnblocked() {
            return unblocked;
        }

        public boolean isThresholdReached() {
            return thresholdReached;
        }

        public long getBlockedUntil() {
            return blockedUntil;
        }

        public boolean isNewlyBlocked() {
            return newlyBlocked;
        }

        public int getCurrentCount() {
            return currentCount;
        }

        public int getMaxRequests() {
            return maxRequests;
        }
    }
}