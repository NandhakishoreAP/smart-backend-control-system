package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.repository.ApiRepository;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/gateway")
public class GatewayController {

    private final ApiRepository apiRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public GatewayController(ApiRepository apiRepository) {
        this.apiRepository = apiRepository;
    }

    @GetMapping("/{slug}/**")
    public Object routeApi(
            @PathVariable String slug,
            HttpServletRequest request
    ) {

        Api api = apiRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("API not found"));

        String fullPath = request.getRequestURI();

        String endpoint = fullPath.replace("/gateway/" + slug, "");

        String targetUrl = api.getUpstreamUrl() + endpoint;

        return restTemplate.getForObject(targetUrl, Object.class);
    }
}