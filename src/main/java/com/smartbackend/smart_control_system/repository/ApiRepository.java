package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.Api;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiRepository extends JpaRepository<Api, Long> {
}