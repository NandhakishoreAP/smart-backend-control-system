package com.smartbackend.smart_control_system.config;

import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.service.NotificationService;
import com.smartbackend.smart_control_system.service.RateLimitService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final NotificationService notificationService;

    public RateLimitFilter(RateLimitService rateLimitService,
                           NotificationService notificationService) {
        this.rateLimitService = rateLimitService;
        this.notificationService = notificationService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = request.getRemoteAddr();
        String path = request.getRequestURI();

        if (path.startsWith("/api/users") ||
            path.startsWith("/api-keys") ||
            path.startsWith("/subscriptions") ||
            path.startsWith("/analytics") ||
            path.startsWith("/api-management") ||
            path.startsWith("/apis") ||
            path.startsWith("/gateway")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (rateLimitService.isRateLimited(clientIp)) {

            notificationService.createNotification(
                    "Too many API requests from IP: " + clientIp,
                NotificationType.WARNING,
                    null
            );

            response.setStatus(429);
            response.getWriter().write("Rate limit exceeded");

            return;
        }

        filterChain.doFilter(request, response);
    }
}