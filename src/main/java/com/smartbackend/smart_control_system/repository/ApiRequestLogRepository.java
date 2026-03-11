package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.ApiRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ApiRequestLogRepository extends JpaRepository<ApiRequestLog, Long> {

    List<ApiRequestLog> findByApiKey(String apiKey);

    @Query("SELECT a.endpoint, COUNT(a.endpoint) FROM ApiRequestLog a GROUP BY a.endpoint ORDER BY COUNT(a.endpoint) DESC")
    List<Object[]> findTopEndpoints();

    @Query("SELECT a.endpoint, COUNT(a.id) FROM ApiRequestLog a GROUP BY a.endpoint")
    List<Object[]> getTrafficStats();
}