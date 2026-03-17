package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.Api;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApiRepository extends JpaRepository<Api, Long> {

    Optional<Api> findByBasePath(String basePath);

    Optional<Api> findByName(String name);

    Optional<Api> findByNameIgnoreCase(String name);

    Optional<Api> findBySlug(String slug);

    long countByActiveTrue();
}