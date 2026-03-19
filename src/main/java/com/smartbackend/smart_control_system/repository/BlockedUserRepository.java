package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.BlockedUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    Optional<BlockedUser> findByUserIdAndApiId(Long userId, Long apiId);
    long deleteByUserIdAndApiId(Long userId, Long apiId);
}