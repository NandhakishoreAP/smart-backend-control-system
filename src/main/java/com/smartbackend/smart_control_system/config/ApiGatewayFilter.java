package com.smartbackend.smart_control_system.config;

import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.ApiKey;
import com.smartbackend.smart_control_system.entity.BlockedUser;
import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.service.ApiAnalyticsService;
import com.smartbackend.smart_control_system.service.ApiKeyService;
import com.smartbackend.smart_control_system.service.ApiService;
import com.smartbackend.smart_control_system.service.NotificationService;
import com.smartbackend.smart_control_system.service.RateLimitService;
import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;
import com.smartbackend.smart_control_system.repository.BlockedUserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class ApiGatewayFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;
    private final ApiAnalyticsService analyticsService;
    private final ApiService apiService;
    private final ApiSubscriptionRepository subscriptionRepository;
    private final RateLimitService rateLimitService;
    private final NotificationService notificationService;
    private final BlockedUserRepository blockedUserRepository;

    public ApiGatewayFilter(ApiKeyService apiKeyService,
                            ApiAnalyticsService analyticsService,
                            ApiService apiService,
                            ApiSubscriptionRepository subscriptionRepository,
                            RateLimitService rateLimitService,
                            NotificationService notificationService,
                            BlockedUserRepository blockedUserRepository) {

        this.apiKeyService = apiKeyService;
        this.analyticsService = analyticsService;
        this.apiService = apiService;
        this.subscriptionRepository = subscriptionRepository;
        this.rateLimitService = rateLimitService;
        this.notificationService = notificationService;
        this.blockedUserRepository = blockedUserRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        long start = System.currentTimeMillis();

        // ---------- ALLOW PUBLIC ENDPOINTS ----------

        if (path.startsWith("/api/users") ||
        path.startsWith("/api-keys") ||
        path.startsWith("/analytics") ||
        path.startsWith("/api-management") ||
        path.startsWith("/monitor") ||
        path.startsWith("/subscriptions") ||
        path.startsWith("/apis") ||
        path.startsWith("/admin")) {

        filterChain.doFilter(request, response);
        return;
    }

        // ---------- API KEY VALIDATION ----------

        String apiKeyHeader = request.getHeader("X-API-KEY");

        if (apiKeyHeader == null) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("API key missing");
            return;
        }

        String normalizedKey = apiKeyHeader.replaceFirst("(?i)^\\s*X-API-KEY\\s*:\\s*", "").trim();

        if (normalizedKey.isEmpty()) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("API key missing");
            return;
        }

        ApiKey apiKey;

        try {

            apiKey = apiKeyService.validateApiKey(normalizedKey);

            // Attach user to request
            request.setAttribute("apiUser", apiKey.getUser());

        } catch (Exception e) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid API key");
            return;
        }

        // ---------- SUBSCRIPTION VALIDATION ----------

        if (path.startsWith("/gateway/")) {

            String[] parts = path.split("/");

            if (parts.length > 3) {

                String slug = parts[2];
                String version = parts[3];

                Api api;

                try {

                    // Uses cached lookup
                    api = apiService.getApiBySlugAndVersion(slug, version);

                } catch (Exception e) {

                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("API not found");
                    return;
                }

                Long userId = apiKey.getUser().getId();

                Optional<BlockedUser> blocked = blockedUserRepository.findByUserIdAndApiId(userId, api.getId());
                if (blocked.isPresent()) {
                    int blockDuration = api.getBlockDurationSeconds() == null ? 900 : api.getBlockDurationSeconds();
                    LocalDateTime blockedAt = blocked.get().getBlockedAt();
                    if (blockedAt != null && blockedAt.plusSeconds(blockDuration).isAfter(LocalDateTime.now())) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.getWriter().write("User blocked due to abuse");
                        return;
                    }
                    blockedUserRepository.deleteByUserIdAndApiId(userId, api.getId());
                    rateLimitService.clearBlock(api.getId() + ":" + normalizedKey);
                }

                boolean subscribed = subscriptionRepository
                        .existsByConsumer_IdAndApi_Id(userId, api.getId());

                if (!subscribed) {

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("User not subscribed to this API");
                    return;
                }

                String rateKey = api.getId() + ":" + normalizedKey;
                int usageThreshold = api.getUsageThresholdPercent() == null ? 80 : api.getUsageThresholdPercent();
                int violationThreshold = api.getViolationThreshold() == null ? 3 : api.getViolationThreshold();
                int violationWindow = api.getViolationWindowSeconds() == null ? 300 : api.getViolationWindowSeconds();
                int blockDuration = api.getBlockDurationSeconds() == null ? 900 : api.getBlockDurationSeconds();

                RateLimitService.RateLimitResult rateResult = rateLimitService.checkAndConsume(
                    rateKey,
                    api.getRateLimit(),
                    usageThreshold,
                    violationThreshold,
                    violationWindow,
                    blockDuration
                );

                if (rateResult.isUnblocked()) {
                    notifyUser(apiKey.getUser(), NotificationType.INFO,
                                "You are now unblocked and can access " + api.getName());
                    notifyUser(api.getProvider(), NotificationType.INFO,
                                "Consumer " + apiKey.getUser().getName() + " is unblocked on " + api.getName());
                }

                if (rateResult.isThresholdReached()) {
                    String message = "Usage for " + api.getName() + " is nearing the limit (" +
                            rateResult.getCurrentCount() + "/" + rateResult.getMaxRequests() + ").";
                    notifyUser(apiKey.getUser(), NotificationType.WARNING, message);
                    notifyUser(api.getProvider(), NotificationType.WARNING, message);
                }

                if (rateResult.isBlocked()) {
                    if (rateResult.isNewlyBlocked()) {
                        String message = "You have been blocked due to excessive usage of " + api.getName() +
                            ". Block duration: " + (blockDuration / 60) + " minutes.";
                        String reason = "Exceeded rate limit " + api.getRateLimit() + " rpm with " +
                                (api.getViolationThreshold() == null ? 3 : api.getViolationThreshold()) +
                                " violations in " +
                                (api.getViolationWindowSeconds() == null ? 300 : api.getViolationWindowSeconds()) +
                                " seconds.";
                        if (blockedUserRepository.findByUserIdAndApiId(userId, api.getId()).isEmpty()) {
                            blockedUserRepository.save(new BlockedUser(userId, api.getId(), reason));
                        }
                        notifyUser(apiKey.getUser(), NotificationType.ERROR, message);
                        notifyUser(api.getProvider(), NotificationType.WARNING,
                                "Consumer " + apiKey.getUser().getName() + " was blocked for " + api.getName() + ".");
                    }
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("User blocked due to abuse");
                    return;
                }

                if (!rateResult.isAllowed()) {
                    response.setStatus(429);
                    response.getWriter().write("Rate limit exceeded");
                    return;
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("Gateway path missing API version");
                return;
            }
        }

        // ---------- CONTINUE REQUEST ----------

        filterChain.doFilter(request, response);

        long latency = System.currentTimeMillis() - start;

        // ---------- LOG ANALYTICS ----------

        analyticsService.logRequest(
            normalizedKey,
                request.getRequestURI(),
                request.getMethod(),
                response.getStatus(),
                latency
        );
    }

    private void notifyUser(com.smartbackend.smart_control_system.entity.User user,
                            NotificationType type,
                            String message) {
        if (user == null) {
            return;
        }
        notificationService.createNotification(message, type, user);
    }
}