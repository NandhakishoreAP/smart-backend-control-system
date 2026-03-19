package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.ApiResponse;
import com.smartbackend.smart_control_system.service.ApiService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/apis")
public class ApiMarketplaceController {

    private final ApiService apiService;

    public ApiMarketplaceController(ApiService apiService) {
        this.apiService = apiService;
    }

    @GetMapping("/marketplace")
    public List<ApiResponse> getMarketplaceApis() {
        return apiService.getMarketplaceApis();
    }

    @GetMapping("/{slug}")
    public ApiResponse getApiDetails(@PathVariable String slug) {
        return apiService.getApiDetails(slug);
    }

    @GetMapping("/{slug}/{version}")
    public ApiResponse getApiDetailsByVersion(
            @PathVariable String slug,
            @PathVariable String version) {
        return apiService.getApiDetails(slug, version);
    }

    @GetMapping("/{slug}/versions")
    public List<String> getApiVersions(@PathVariable String slug) {
        return apiService.getVersionsBySlug(slug);
    }

}