package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.Notification;
import com.smartbackend.smart_control_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser(User user);

    List<Notification> findByUserAndReadFalse(User user);
}