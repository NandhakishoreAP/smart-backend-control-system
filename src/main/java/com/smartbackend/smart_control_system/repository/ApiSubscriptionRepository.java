package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.ApiSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiSubscriptionRepository extends JpaRepository<ApiSubscription, Long> {

    List<ApiSubscription> findByConsumer_Id(Long consumerId);

    boolean existsByConsumer_IdAndApi_Id(Long consumerId, Long apiId);

}