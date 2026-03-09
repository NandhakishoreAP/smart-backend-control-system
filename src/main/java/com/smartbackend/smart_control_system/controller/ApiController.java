package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.ApiResponse;
import com.smartbackend.smart_control_system.dto.CreateApiRequest;
import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.UserRepository;
import com.smartbackend.smart_control_system.service.ApiService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api-management")
public class ApiController {

    private final ApiService apiService;
    private final UserRepository userRepository;

    public ApiController(ApiService apiService,
                         UserRepository userRepository) {

        this.apiService = apiService;
        this.userRepository = userRepository;
    }

@PostMapping("/create")
public ApiResponse createApi(@RequestBody CreateApiRequest request) {

    User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));

    Api api = apiService.createApi(
            request.getName(),
            request.getDescription(),
            user
    );

    return apiService.convertToResponse(api);
}

    @GetMapping("/list")
    public List<Api> listApis() {
        return apiService.getAllApis();
    }
}