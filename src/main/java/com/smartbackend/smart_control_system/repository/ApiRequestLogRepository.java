package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.ApiRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ApiRequestLogRepository extends JpaRepository<ApiRequestLog, Long> {

    List<ApiRequestLog> findByApiKey(String apiKey);

    List<ApiRequestLog> findTop20ByApiKeyOrderByTimestampDesc(String apiKey);

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

    @Query("""
    SELECT COUNT(a)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since
    """)
    long countSince(@Param("since") LocalDateTime since);

    @Query("""
    SELECT COUNT(a)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.apiKey = :apiKey
    """)
    long countSinceAndApiKey(@Param("since") LocalDateTime since, @Param("apiKey") String apiKey);

    @Query("""
    SELECT COUNT(a)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.status >= 400
    """)
    long countErrorSince(@Param("since") LocalDateTime since);

    @Query("""
    SELECT COUNT(a)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.status >= 400 AND a.apiKey = :apiKey
    """)
    long countErrorSinceAndApiKey(@Param("since") LocalDateTime since, @Param("apiKey") String apiKey);

    @Query("""
    SELECT COALESCE(AVG(a.latency), 0)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since
    """)
    double averageLatencySince(@Param("since") LocalDateTime since);

    @Query("""
    SELECT COALESCE(AVG(a.latency), 0)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.apiKey = :apiKey
    """)
    double averageLatencySinceAndApiKey(@Param("since") LocalDateTime since, @Param("apiKey") String apiKey);

        @Query("""
        SELECT a.endpoint,
            COUNT(a),
            SUM(CASE WHEN a.status >= 400 THEN 1 ELSE 0 END),
            COALESCE(AVG(a.latency), 0)
        FROM ApiRequestLog a
        WHERE a.timestamp >= :since AND a.apiKey = :apiKey
        GROUP BY a.endpoint
        ORDER BY COUNT(a) DESC
        """)
        List<Object[]> getEndpointStatsSinceAndApiKey(@Param("since") LocalDateTime since, @Param("apiKey") String apiKey);

    @Query("""
    SELECT COUNT(DISTINCT a.endpoint)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.apiKey = :apiKey
    """)
    long countDistinctEndpointsSinceAndApiKey(@Param("since") LocalDateTime since, @Param("apiKey") String apiKey);

    @Query("""
    SELECT COUNT(a)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.endpoint LIKE :endpoint
    """)
    long countSinceAndEndpointLike(@Param("since") LocalDateTime since, @Param("endpoint") String endpoint);

        @Query("""
        SELECT COUNT(a)
        FROM ApiRequestLog a
        WHERE a.timestamp >= :since AND a.apiKey = :apiKey AND a.endpoint LIKE :endpoint
        """)
        long countSinceAndApiKeyAndEndpointLike(
            @Param("since") LocalDateTime since,
            @Param("apiKey") String apiKey,
            @Param("endpoint") String endpoint
        );

    @Query("""
    SELECT COUNT(a)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.status >= 400 AND a.endpoint LIKE :endpoint
    """)
    long countErrorSinceAndEndpointLike(@Param("since") LocalDateTime since, @Param("endpoint") String endpoint);

    @Query("""
    SELECT COALESCE(AVG(a.latency), 0)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.endpoint LIKE :endpoint
    """)
    double averageLatencySinceAndEndpointLike(@Param("since") LocalDateTime since, @Param("endpoint") String endpoint);

    @Query("""
    SELECT COUNT(a)
    FROM ApiRequestLog a
    WHERE a.timestamp >= :since AND a.status = :status AND a.endpoint LIKE :endpoint
    """)
    long countStatusSinceAndEndpointLike(
            @Param("since") LocalDateTime since,
            @Param("status") int status,
            @Param("endpoint") String endpoint
    );

    long deleteByEndpointLike(String endpoint);
}