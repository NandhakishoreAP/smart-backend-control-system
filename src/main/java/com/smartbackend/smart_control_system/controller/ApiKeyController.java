package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.ApiKeyResponse;
import com.smartbackend.smart_control_system.entity.ApiKey;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.UserRepository;
import com.smartbackend.smart_control_system.service.ApiKeyService;
import org.springframework.web.bind.annotation.*;

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
}