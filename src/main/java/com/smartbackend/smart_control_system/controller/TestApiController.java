package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.entity.UserRole;
import com.smartbackend.smart_control_system.repository.UserRepository;
import com.smartbackend.smart_control_system.security.JwtService;
import com.smartbackend.smart_control_system.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestApiController {

    private final EmailService emailService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public TestApiController(EmailService emailService,
                             JwtService jwtService,
                             UserRepository userRepository) {
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @GetMapping("/api/test")
    public String testApi() {
        return "API Gateway Working!";
    }

    @GetMapping("/admin/email/test")
    public ResponseEntity<String> testEmail(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        ResponseEntity<String> authResult = requireAdmin(authorization);
        if (authResult != null) {
            return authResult;
        }
        emailService.sendTestEmail();
        return ResponseEntity.ok("Test email sent");
    }

    @GetMapping("/admin/email/send")
    public ResponseEntity<String> sendEmail(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "Smart Control Test Email") String subject,
            @RequestParam(defaultValue = "Test email from Smart Control System.") String body) {
        ResponseEntity<String> authResult = requireAdmin(authorization);
        if (authResult != null) {
            return authResult;
        }
        try {
            String token = authorization.substring(7);
            Long userId = jwtService.extractUserId(token);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid token");
            }
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            emailService.sendEmail(user.getEmail(), subject, body);
            return ResponseEntity.ok("Email sent to " + user.getEmail());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid token");
        }
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