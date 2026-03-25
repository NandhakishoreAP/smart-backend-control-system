package com.smartbackend.smart_control_system.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class GlobalRequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(GlobalRequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("[GLOBAL/FILTER] ")
          .append(request.getMethod()).append(" ")
          .append(request.getRequestURI()).append(" | Headers: ");
        Collections.list(request.getHeaderNames()).forEach(name ->
            sb.append(name).append(": ").append(request.getHeader(name)).append("; ")
        );
        logger.warn(sb.toString());
        filterChain.doFilter(request, response);
    }
}
