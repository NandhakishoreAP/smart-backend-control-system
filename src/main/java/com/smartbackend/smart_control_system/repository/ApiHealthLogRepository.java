package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.ApiHealthLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ApiHealthLogRepository extends JpaRepository<ApiHealthLog, Long> {

    List<ApiHealthLog> findTop12ByApi_IdOrderByTimestampDesc(Long apiId);

    long deleteByTimestampBefore(LocalDateTime threshold);

    long deleteByApi_Id(Long apiId);
}
