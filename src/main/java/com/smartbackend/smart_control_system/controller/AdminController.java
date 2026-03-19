package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.entity.UserRole;
import com.smartbackend.smart_control_system.security.JwtService;
import com.smartbackend.smart_control_system.service.UsageResetScheduler;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final JwtService jwtService;
    private final UsageResetScheduler usageResetScheduler;

    public AdminController(JwtService jwtService, UsageResetScheduler usageResetScheduler) {
        this.jwtService = jwtService;
        this.usageResetScheduler = usageResetScheduler;
    }

    @GetMapping("/reset-usage")
    public ResponseEntity<String> triggerUsageReset(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        ResponseEntity<String> authResult = requireAdmin(authorization);
        if (authResult != null) {
            return authResult;
        }
        usageResetScheduler.resetDailyUsage();
        return ResponseEntity.ok("Usage reset triggered");
    }

    private ResponseEntity<String> requireAdmin(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Missing Authorization header");
        }
        try {
            String token = authorization.substring(7);
            String role = jwtService.extractRole(token);
            if (role == null || !UserRole.ADMIN.name().equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Admin access required");
            }
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid token");
        }
        return null;
    }
}
