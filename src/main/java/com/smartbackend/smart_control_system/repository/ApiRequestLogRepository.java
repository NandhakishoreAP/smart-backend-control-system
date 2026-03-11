package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.ApiRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ApiRequestLogRepository extends JpaRepository<ApiRequestLog, Long> {

    List<ApiRequestLog> findByApiKey(String apiKey);

    // Top endpoints
    @Query("""
    SELECT a.endpoint, COUNT(a.id)
    FROM ApiRequestLog a
    GROUP BY a.endpoint
    ORDER BY COUNT(a.id) DESC
    """)
    List<Object[]> findTopEndpoints();


    // Traffic stats
    @Query("""
    SELECT a.endpoint, COUNT(a.id)
    FROM ApiRequestLog a
    GROUP BY a.endpoint
    """)
    List<Object[]> getTrafficStats();


    // Top API consumers
    @Query("""
    SELECT a.apiKey, COUNT(a.id)
    FROM ApiRequestLog a
    GROUP BY a.apiKey
    ORDER BY COUNT(a.id) DESC
    """)
    List<Object[]> findTopApiConsumers();
}