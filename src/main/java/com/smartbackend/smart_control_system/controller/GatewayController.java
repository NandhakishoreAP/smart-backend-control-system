package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.repository.ApiRepository;
import com.smartbackend.smart_control_system.service.ApiAnalyticsService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/gateway")
public class GatewayController {

    private final ApiRepository apiRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ApiAnalyticsService analyticsService;


    public GatewayController(ApiRepository apiRepository, ApiAnalyticsService analyticsService) {
        this.apiRepository = apiRepository;
        this.analyticsService = analyticsService;
    }

        @RequestMapping(value = "/{slug}/{version}/**", method = {
            RequestMethod.GET,
            RequestMethod.POST,
            RequestMethod.PUT,
            RequestMethod.DELETE
        })
        public ResponseEntity<Object> routeApi(
            @PathVariable String slug,
            @PathVariable String version,
            HttpServletRequest request
    ) {

        Api api = apiRepository.findBySlugAndVersion(slug, version)
            .or(() -> "v1".equalsIgnoreCase(version)
                ? apiRepository.findBySlugAndVersionOrVersionIsNull(slug, version)
                : java.util.Optional.empty())
            .orElseThrow(() -> new RuntimeException("API not found"));

        if (api.getUpstreamUrl() == null || api.getUpstreamUrl().isBlank()) {
            throw new IllegalArgumentException("Upstream URL not configured for this API");
        }

        String fullPath = request.getRequestURI();
        String endpoint = fullPath.replace("/gateway/" + slug + "/" + version, "");
        if (endpoint.isBlank()) {
            endpoint = "/";
        }

        String base = api.getUpstreamUrl();
        String targetUrl;
        if (base.endsWith("/") && endpoint.startsWith("/")) {
            targetUrl = base.substring(0, base.length() - 1) + endpoint;
        } else if (!base.endsWith("/") && !endpoint.startsWith("/")) {
            targetUrl = base + "/" + endpoint;
        } else {
            targetUrl = base + endpoint;
        }

        HttpMethod method;
        try {
            method = HttpMethod.valueOf(request.getMethod());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported HTTP method");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_TYPE, request.getContentType() == null
                ? "application/json"
                : request.getContentType());

        String body = extractBody(request);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        long start = System.currentTimeMillis();
        try {
            ResponseEntity<Object> response = restTemplate.exchange(targetUrl, method, entity, Object.class);
            long latency = System.currentTimeMillis() - start;
            // Log successful request
            String apiKey = request.getHeader("X-API-KEY");
            analyticsService.logRequest(
                apiKey != null ? apiKey : "anonymous",
                endpoint,
                method.name(),
                response.getStatusCodeValue(),
                latency
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpStatusCodeException ex) {
            long latency = System.currentTimeMillis() - start;
            // Log failed request
            String apiKey = request.getHeader("X-API-KEY");
            analyticsService.logRequest(
                apiKey != null ? apiKey : "anonymous",
                endpoint,
                method.name(),
                ex.getStatusCode().value(),
                latency
            );
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        }
    }

    private String extractBody(HttpServletRequest request) {
        try (BufferedReader reader = request.getReader()) {
            return reader.lines().collect(Collectors.joining("\n"));
        } catch (IOException ex) {
            return null;
        }
    }
}