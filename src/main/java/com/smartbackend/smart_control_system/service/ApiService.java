package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.ApiResponse;
import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.ApiRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApiService {

    private final ApiRepository apiRepository;

    public ApiService(ApiRepository apiRepository) {
        this.apiRepository = apiRepository;
    }

public Api createApi(String name, String description, User provider) {

    Api api = new Api();

    api.setName(name);
    api.setSlug(name.toLowerCase().replace(" ", "-"));
    api.setBasePath("/" + api.getSlug());
    api.setDescription(description);
    api.setProvider(provider);
    api.setRateLimit(100);
    api.setActive(true);

    return apiRepository.save(api);
}

    public List<Api> getAllApis() {
        return apiRepository.findAll();
    }

    public List<ApiResponse> getMarketplaceApis() {

    return apiRepository.findAll()
            .stream()
            .filter(Api::isActive)
            .map(this::convertToResponse)
            .toList();
}

public ApiResponse getApiDetails(String slug) {

    Api api = apiRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("API not found"));

    return convertToResponse(api);
}

    public ApiResponse convertToResponse(Api api) {

    ApiResponse response = new ApiResponse();

    response.setId(api.getId());
    response.setName(api.getName());
    response.setSlug(api.getSlug());
    response.setDescription(api.getDescription());
    response.setActive(api.isActive());
    response.setRateLimit(api.getRateLimit());

    return response;
}

    // -------- NEW METHOD FOR GATEWAY --------

    @Cacheable(value = "apis", key = "#slug")
    public Api getApiBySlug(String slug) {

        return apiRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("API not found"));
    }
}