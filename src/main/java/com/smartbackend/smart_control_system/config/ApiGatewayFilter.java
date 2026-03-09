package com.smartbackend.smart_control_system.config;

import com.smartbackend.smart_control_system.entity.ApiKey;
import com.smartbackend.smart_control_system.service.ApiAnalyticsService;
import com.smartbackend.smart_control_system.service.ApiKeyService;

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

    public ApiGatewayFilter(ApiKeyService apiKeyService,
                            ApiAnalyticsService analyticsService) {

        this.apiKeyService = apiKeyService;
        this.analyticsService = analyticsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        long start = System.currentTimeMillis();

        // Allow public endpoints
        if (path.startsWith("/api/users") ||
            path.startsWith("/api-keys") ||
            path.startsWith("/analytics")) {

            filterChain.doFilter(request, response);
            return;
        }

        String apiKeyHeader = request.getHeader("X-API-KEY");

        if (apiKeyHeader == null) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("API key missing");
            return;
        }

        ApiKey apiKey;

        try {

            apiKey = apiKeyService.validateApiKey(apiKeyHeader);

            // attach user to request
            request.setAttribute("apiUser", apiKey.getUser());

        } catch (Exception e) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid API key");
            return;
        }

        // continue request
        filterChain.doFilter(request, response);

        long latency = System.currentTimeMillis() - start;

        // log analytics
        analyticsService.logRequest(
                apiKeyHeader,
                request.getRequestURI(),
                request.getMethod(),
                response.getStatus(),
                latency
        );
    }
}