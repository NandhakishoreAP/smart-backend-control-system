package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.ApiEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiEndpointRepository extends JpaRepository<ApiEndpoint, Long> {

	long deleteByApi_Id(Long apiId);
}