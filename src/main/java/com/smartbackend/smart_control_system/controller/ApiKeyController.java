package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.ApiKeyResponse;
import com.smartbackend.smart_control_system.entity.ApiKey;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.UserRepository;
import com.smartbackend.smart_control_system.service.ApiKeyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api-keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final UserRepository userRepository;

    public ApiKeyController(ApiKeyService apiKeyService,
                            UserRepository userRepository) {
        this.apiKeyService = apiKeyService;
        this.userRepository = userRepository;
    }

@PostMapping("/generate/{userId}")
public ApiKeyResponse generateKey(@PathVariable Long userId){

    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    ApiKey apiKey = apiKeyService.generateApiKey(user);

    return apiKeyService.convertToResponse(apiKey);
    }

    @GetMapping
    public List<ApiKeyResponse> getAllKeys() {
        return apiKeyService.getAllApiKeys();
    }

    @PostMapping
    public ApiKeyResponse createKey(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ApiKey apiKey = apiKeyService.generateApiKey(user);

        return apiKeyService.convertToResponse(apiKey);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteKey(@PathVariable Long id) {
        apiKeyService.deleteApiKey(id);
        return Map.of("message", "API key deleted successfully");
    }
}