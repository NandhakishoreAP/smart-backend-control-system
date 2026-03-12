package com.smartbackend.smart_control_system.config;

import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.ApiKey;
import com.smartbackend.smart_control_system.service.ApiAnalyticsService;
import com.smartbackend.smart_control_system.service.ApiKeyService;
import com.smartbackend.smart_control_system.service.ApiService;
import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiGatewayFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;
    private final ApiAnalyticsService analyticsService;
    private final ApiService apiService;
    private final ApiSubscriptionRepository subscriptionRepository;

    public ApiGatewayFilter(ApiKeyService apiKeyService,
                            ApiAnalyticsService analyticsService,
                            ApiService apiService,
                            ApiSubscriptionRepository subscriptionRepository) {

        this.apiKeyService = apiKeyService;
        this.analyticsService = analyticsService;
        this.apiService = apiService;
        this.subscriptionRepository = subscriptionRepository;
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
        path.startsWith("/apis")) {

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

        ApiKey apiKey;

        try {

            apiKey = apiKeyService.validateApiKey(apiKeyHeader);

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

            if (parts.length > 2) {

                String slug = parts[2];

                Api api;

                try {

                    // Uses cached lookup
                    api = apiService.getApiBySlug(slug);

                } catch (Exception e) {

                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("API not found");
                    return;
                }

                Long userId = apiKey.getUser().getId();

                boolean subscribed = subscriptionRepository
                        .existsByConsumer_IdAndApi_Id(userId, api.getId());

                if (!subscribed) {

                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("User not subscribed to this API");
                    return;
                }
            }
        }

        // ---------- CONTINUE REQUEST ----------

        filterChain.doFilter(request, response);

        long latency = System.currentTimeMillis() - start;

        // ---------- LOG ANALYTICS ----------

        analyticsService.logRequest(
                apiKeyHeader,
                request.getRequestURI(),
                request.getMethod(),
                response.getStatus(),
                latency
        );
    }
}