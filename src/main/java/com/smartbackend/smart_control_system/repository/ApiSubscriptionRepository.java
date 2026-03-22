package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.ApiSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiSubscriptionRepository extends JpaRepository<ApiSubscription, Long> {

    List<ApiSubscription> findByConsumer_Id(Long consumerId);

    boolean existsByConsumer_IdAndApi_Id(Long consumerId, Long apiId);

    Optional<ApiSubscription> findByConsumer_IdAndApi_Id(Long consumerId, Long apiId);

    long countByApi_Id(Long apiId);

    long deleteByApi_Id(Long apiId);

    @Query("""
        SELECT COUNT(s)
        FROM ApiSubscription s
        WHERE s.api.provider.id = :providerId
    """)
    long countByProviderId(@Param("providerId") Long providerId);


        @Query("SELECT new com.smartbackend.smart_control_system.dto.ProviderSubscriberInsightResponse(s.id, c.name, c.email, a.name, a.slug, a.version, (SELECT COUNT(l.id) FROM ApiRequestLog l WHERE l.apiKey = s.apiKey AND l.endpoint LIKE CONCAT('%', a.slug, '%'))) " +
            "FROM ApiSubscription s JOIN s.consumer c JOIN s.api a WHERE a.provider.id = :providerId")
        List<com.smartbackend.smart_control_system.dto.ProviderSubscriberInsightResponse> findSubscriberInsightsByProviderId(@Param("providerId") Long providerId);

}