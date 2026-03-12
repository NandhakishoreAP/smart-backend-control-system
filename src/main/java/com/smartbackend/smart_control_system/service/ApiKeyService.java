package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.ApiKeyResponse;
import com.smartbackend.smart_control_system.entity.ApiKey;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.ApiKeyRepository;
import com.smartbackend.smart_control_system.util.ApiKeyGenerator;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

@Service
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyService(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    public ApiKey generateApiKey(User user) {

        String key = ApiKeyGenerator.generateKey();

        ApiKey apiKey = new ApiKey(key, user);

        return apiKeyRepository.save(apiKey);
    }

    @Cacheable(value = "apiKeys", key = "#key")
public ApiKey validateApiKey(String key) {

    return apiKeyRepository.findByApiKey(key)
            .orElseThrow(() -> new RuntimeException("Invalid API Key"));
}

    public ApiKeyResponse convertToResponse(ApiKey key){

    return new ApiKeyResponse(
        key.getId(),
        key.getApiKey(),
        key.getUser().getId(),
        key.isActive(),
        key.getCreatedAt()
    );
}
}