package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    Optional<ApiKey> findByApiKey(String apiKey);

    Optional<ApiKey> findTopByUser_IdAndActiveTrueOrderByCreatedAtDesc(Long userId);
}