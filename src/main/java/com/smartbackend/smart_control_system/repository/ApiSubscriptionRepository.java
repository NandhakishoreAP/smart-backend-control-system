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

}