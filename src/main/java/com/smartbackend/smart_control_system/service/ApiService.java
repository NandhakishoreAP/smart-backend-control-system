package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.ApiResponse;
import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.ApiRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApiService {

    private final ApiRepository apiRepository;

    public ApiService(ApiRepository apiRepository) {
        this.apiRepository = apiRepository;
    }

    public Api createApi(String name, String description, User owner) {

        Api api = new Api(name, description, owner);

        return apiRepository.save(api);
    }

    public List<Api> getAllApis() {
        return apiRepository.findAll();
    }

    public ApiResponse convertToResponse(Api api){
    return new ApiResponse(
            api.getId(),
            api.getName(),
            api.getDescription(),
            api.getOwner().getId(),
            api.getCreatedAt()
    );
}
}