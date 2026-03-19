package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.ApiResponse;
import com.smartbackend.smart_control_system.dto.CreateApiRequest;
import com.smartbackend.smart_control_system.dto.ProviderApiListResponse;
import com.smartbackend.smart_control_system.dto.ProviderApiHealthResponse;
import com.smartbackend.smart_control_system.dto.ProviderDashboardResponse;
import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.UserRepository;
import com.smartbackend.smart_control_system.service.ApiService;
import com.smartbackend.smart_control_system.service.ApiHealthService;
import com.smartbackend.smart_control_system.service.ProviderAnalyticsService;
import com.smartbackend.smart_control_system.service.EmailService;
import com.smartbackend.smart_control_system.service.NotificationService;
import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;
import com.smartbackend.smart_control_system.security.JwtService;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api-management")
public class ApiController {

    private final ApiService apiService;
    private final UserRepository userRepository;
    private final ProviderAnalyticsService providerAnalyticsService;
    private final ApiSubscriptionRepository subscriptionRepository;
    private final JwtService jwtService;
    private final ApiHealthService apiHealthService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public ApiController(ApiService apiService,
                         UserRepository userRepository,
                         ProviderAnalyticsService providerAnalyticsService,
                         ApiSubscriptionRepository subscriptionRepository,
                         JwtService jwtService,
                         ApiHealthService apiHealthService,
                         EmailService emailService,
                         NotificationService notificationService) {

        this.apiService = apiService;
        this.userRepository = userRepository;
        this.providerAnalyticsService = providerAnalyticsService;
        this.subscriptionRepository = subscriptionRepository;
        this.jwtService = jwtService;
        this.apiHealthService = apiHealthService;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

@PostMapping("/create")
public ApiResponse createApi(@RequestBody CreateApiRequest request) {

    User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (request.getUpstreamUrl() == null || request.getUpstreamUrl().isBlank()) {
        throw new IllegalArgumentException("Upstream URL is required");
    }

        Api api = apiService.createApi(
            request.getName(),
            request.getDescription(),
            request.getSlug(),
            request.getVersion(),
            request.getRateLimit(),
            request.getUpstreamUrl(),
            request.getViolationThreshold(),
            request.getViolationWindowSeconds(),
            request.getBlockDurationSeconds(),
            request.getUsageThresholdPercent(),
            request.getResetInterval(),
            user
        );

        sendPublishEmail(user, api);
            notifyProvider(user, buildPublishMessage(api));

    return apiService.convertToResponse(api);
}

    @GetMapping("/list")
    public List<Api> listApis() {
        return apiService.getAllApis();
    }

    @GetMapping("/provider/apis")
    public ResponseEntity<List<ProviderApiListResponse>> listProviderApis(HttpServletRequest request) {
        AuthContext auth = resolveAuth(request);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }

        List<ProviderApiListResponse> responses = apiService.getApisByProvider(auth.userId)
                .stream()
                .map(api -> new ProviderApiListResponse(
                        api.getId(),
                        api.getName(),
                        api.getSlug(),
                    api.getVersion(),
                        api.getDescription(),
                        api.isActive(),
                        api.getRateLimit(),
                    api.getViolationThreshold(),
                    api.getViolationWindowSeconds(),
                    api.getBlockDurationSeconds(),
                    api.getUsageThresholdPercent(),
                        api.getUpstreamUrl(),
                        api.getCreatedAt(),
                        subscriptionRepository.countByApi_Id(api.getId())
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/provider/{userId}")
    public ResponseEntity<List<ProviderApiListResponse>> listProviderApisByUser(
            @PathVariable Long userId,
            HttpServletRequest request) {
        AuthContext auth = resolveAuth(request);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }
        if (!auth.userId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }

        List<ProviderApiListResponse> responses = apiService.getProviderEntities(userId)
                .stream()
                .map(api -> new ProviderApiListResponse(
                        api.getId(),
                        api.getName(),
                        api.getSlug(),
                    api.getVersion(),
                        api.getDescription(),
                        api.isActive(),
                        api.getRateLimit(),
                    api.getViolationThreshold(),
                    api.getViolationWindowSeconds(),
                    api.getBlockDurationSeconds(),
                    api.getUsageThresholdPercent(),
                        api.getUpstreamUrl(),
                        api.getCreatedAt() == null ? null : api.getCreatedAt().toString(),
                        subscriptionRepository.countByApi_Id(api.getId())
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/provider/apis")
    public ResponseEntity<ApiResponse> createProviderApi(
            @RequestBody CreateApiRequest request,
            HttpServletRequest httpRequest) {

        AuthContext auth = resolveAuth(httpRequest);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }

        if (request.getUpstreamUrl() == null || request.getUpstreamUrl().isBlank()) {
            throw new IllegalArgumentException("Upstream URL is required");
        }

        User user = userRepository.findById(auth.userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            Api api = apiService.createApi(
                    request.getName(),
                    request.getDescription(),
                    request.getSlug(),
                    request.getVersion(),
                    request.getRateLimit(),
                    request.getUpstreamUrl(),
                    request.getViolationThreshold(),
                    request.getViolationWindowSeconds(),
                    request.getBlockDurationSeconds(),
                    request.getUsageThresholdPercent(),
                    request.getResetInterval(),
                    user
            );

            sendPublishEmail(user, api);
            notifyProvider(user, buildPublishMessage(api));

            return ResponseEntity.ok(apiService.convertToResponse(api));
        } catch (IllegalArgumentException ex) {
            if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("exists")) {
                return ResponseEntity.status(409).build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    private void notifyProvider(User user, String message) {
        if (user == null) {
            return;
        }
        notificationService.createNotificationNoEmail(message, NotificationType.INFO, user);
    }

    private String buildPublishMessage(Api api) {
        String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
        return "API published: " + api.getName() + " (" + version + ") is now live.";
    }

    private String buildDeleteMessage(Api api) {
        String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
        return "API deleted: " + api.getName() + " (" + version + ") was removed.";
    }

    private void sendPublishEmail(User user, Api api) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
        int violationThreshold = api.getViolationThreshold() == null ? 3 : api.getViolationThreshold();
        int violationWindow = api.getViolationWindowSeconds() == null ? 300 : api.getViolationWindowSeconds();
        int blockDuration = api.getBlockDurationSeconds() == null ? 900 : api.getBlockDurationSeconds();
        int usageThreshold = api.getUsageThresholdPercent() == null ? 80 : api.getUsageThresholdPercent();

                String subject = "Your API is Live | " + api.getName() + " " + version;
                String basePath = api.getBasePath() == null ? ("/" + api.getSlug() + "/" + version) : api.getBasePath();
                String html = """
                                <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#111;\">
                                    <h2 style=\"margin:0 0 8px;\">API published successfully</h2>
                                    <p style=\"margin:0 0 16px;\">Hello %s, your API is now live and visible to consumers.</p>
                                    <h3 style=\"margin:16px 0 8px;\">API details</h3>
                                    <table style=\"border-collapse:collapse;margin:8px 0 12px;\">
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Name</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Slug</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Version</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Base path</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Upstream URL</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                                    </table>
                                    <h3 style=\"margin:16px 0 8px;\">Policy</h3>
                                    <table style=\"border-collapse:collapse;margin:8px 0 12px;\">
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Rate limit</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%d rpm</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Usage alert</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%d%%</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Violations</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%d in %s</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Block duration</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                                    </table>
                                    <p style=\"margin:16px 0 0;\">Thanks for publishing with Smart Control System.</p>
                                </div>
                                """.formatted(
                                user.getName(),
                                api.getName(),
                                api.getSlug(),
                                version,
                                basePath,
                                api.getUpstreamUrl(),
                                api.getRateLimit(),
                                usageThreshold,
                                violationThreshold,
                                formatDuration(violationWindow),
                                formatDuration(blockDuration)
                );

        try {
            emailService.sendHtmlEmail(user.getEmail(), subject, html);
        } catch (Exception ex) {
            System.out.println("Publish email failed: " + ex.getMessage());
        }
    }

    private void sendDeleteEmail(User user, Api api) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
        String basePath = api.getBasePath() == null ? ("/" + api.getSlug() + "/" + version) : api.getBasePath();
                int violationThreshold = api.getViolationThreshold() == null ? 3 : api.getViolationThreshold();
                int violationWindow = api.getViolationWindowSeconds() == null ? 300 : api.getViolationWindowSeconds();
                int blockDuration = api.getBlockDurationSeconds() == null ? 900 : api.getBlockDurationSeconds();
                int usageThreshold = api.getUsageThresholdPercent() == null ? 80 : api.getUsageThresholdPercent();
        String subject = "API Deleted | " + api.getName() + " " + version;
        String html = """
                <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#111;\">
                  <h2 style=\"margin:0 0 8px;\">API deleted</h2>
                  <p style=\"margin:0 0 16px;\">Hello %s, your API has been removed from the marketplace.</p>
                  <table style=\"border-collapse:collapse;margin:8px 0 12px;\">
                    <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Name</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                    <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Slug</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                    <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Version</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                    <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Base path</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Upstream URL</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                  </table>
                                    <h3 style=\"margin:16px 0 8px;\">Policy</h3>
                                    <table style=\"border-collapse:collapse;margin:8px 0 12px;\">
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Rate limit</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%d rpm</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Usage alert</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%d%%</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Violations</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%d in %s</td></tr>
                                        <tr><td style=\"padding:6px 12px;border:1px solid #eee;\">Block duration</td><td style=\"padding:6px 12px;border:1px solid #eee;\">%s</td></tr>
                                    </table>
                  <p style=\"margin:16px 0 0;\">If this was not intended, you can publish the API again from your dashboard.</p>
                </div>
                """.formatted(
                user.getName(),
                api.getName(),
                api.getSlug(),
                version,
                                basePath,
                                api.getUpstreamUrl(),
                                api.getRateLimit(),
                                usageThreshold,
                                violationThreshold,
                                formatDuration(violationWindow),
                                formatDuration(blockDuration)
        );

        try {
            emailService.sendHtmlEmail(user.getEmail(), subject, html);
        } catch (Exception ex) {
            System.out.println("Delete email failed: " + ex.getMessage());
        }
    }

    private String formatDuration(int seconds) {
        if (seconds % 86400 == 0) {
            return (seconds / 86400) + " day(s)";
        }
        if (seconds % 3600 == 0) {
            return (seconds / 3600) + " hour(s)";
        }
        if (seconds % 60 == 0) {
            return (seconds / 60) + " minute(s)";
        }
        return seconds + " second(s)";
    }

    @GetMapping("/provider/analytics")
    public ResponseEntity<ProviderDashboardResponse> providerAnalytics(HttpServletRequest request) {
        AuthContext auth = resolveAuth(request);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }

        return ResponseEntity.ok(providerAnalyticsService.getProviderDashboard(auth.userId));
    }

    @GetMapping("/health/provider/{userId}")
    public ResponseEntity<List<ProviderApiHealthResponse>> providerHealth(
            @PathVariable Long userId,
            HttpServletRequest request) {
        AuthContext auth = resolveAuth(request);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }
        if (!auth.userId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(apiHealthService.getProviderHealth(userId));
    }

    @GetMapping("/{apiId}")
    public ResponseEntity<ApiResponse> getProviderApi(@PathVariable Long apiId, HttpServletRequest request) {
        AuthContext auth = resolveAuth(request);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }

        try {
            Api api = apiService.getApiForProvider(apiId, auth.userId);
            return ResponseEntity.ok(apiService.convertToResponse(api));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(403).build();
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).build();
        }
    }

    @PutMapping("/{apiId}")
    public ResponseEntity<ApiResponse> updateProviderApi(
            @PathVariable Long apiId,
            @RequestBody CreateApiRequest request,
            HttpServletRequest httpRequest) {
        AuthContext auth = resolveAuth(httpRequest);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }

        try {
            Api api = apiService.updateApi(
                    apiId,
                    auth.userId,
                    request.getName(),
                    request.getDescription(),
                    request.getSlug(),
                    request.getVersion(),
                    request.getRateLimit(),
                    request.getUpstreamUrl(),
                    request.getActive(),
                    request.getViolationThreshold(),
                    request.getViolationWindowSeconds(),
                    request.getBlockDurationSeconds(),
                    request.getUsageThresholdPercent(),
                    request.getResetInterval()
            );
            return ResponseEntity.ok(apiService.convertToResponse(api));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(403).build();
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).build();
        }
    }

    @PutMapping("/{apiId}/toggle")
    public ResponseEntity<ApiResponse> toggleApi(@PathVariable Long apiId, HttpServletRequest request) {
        AuthContext auth = resolveAuth(request);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }

        try {
            Api updated = apiService.toggleApiActive(apiId, auth.userId);
            return ResponseEntity.ok(apiService.convertToResponse(updated));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(403).build();
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).build();
        }
    }

    @DeleteMapping("/{apiId}")
    public ResponseEntity<Map<String, String>> deleteApi(@PathVariable Long apiId, HttpServletRequest request) {
        AuthContext auth = resolveAuth(request);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }

        try {
            Api api = apiService.getApiForProvider(apiId, auth.userId);
            apiService.deleteApi(apiId, auth.userId);
            notifyProvider(api.getProvider(), buildDeleteMessage(api));
            sendDeleteEmail(api.getProvider(), api);
            return ResponseEntity.ok(Map.of("message", "API deleted successfully"));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(403).build();
        } catch (RuntimeException ex) {
            if ("API not found".equals(ex.getMessage())) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(500).body(Map.of("message", ex.getMessage()));
        }
    }

    @DeleteMapping("/slug/{slug}/{version}")
    public ResponseEntity<Map<String, String>> deleteApiBySlug(
            @PathVariable String slug,
            @PathVariable String version,
            HttpServletRequest request) {
        AuthContext auth = resolveAuth(request);
        if (!auth.allowed) {
            return ResponseEntity.status(auth.status).build();
        }

        try {
            Api api = apiService.getApiBySlugAndVersion(slug, version);
            if (api.getProvider() == null || !api.getProvider().getId().equals(auth.userId)) {
                return ResponseEntity.status(403).build();
            }
            apiService.deleteApiBySlugVersion(auth.userId, slug, version);
            notifyProvider(api.getProvider(), buildDeleteMessage(api));
            sendDeleteEmail(api.getProvider(), api);
            return ResponseEntity.ok(Map.of("message", "API deleted successfully"));
        } catch (RuntimeException ex) {
            if ("API not found".equals(ex.getMessage())) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(500).body(Map.of("message", ex.getMessage()));
        }
    }

    private AuthContext resolveAuth(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return new AuthContext(false, 401, null);
        }
        String token = header.substring(7);
        Long userId = jwtService.extractUserId(token);
        String role = jwtService.extractRole(token);
        if (userId == null) {
            return new AuthContext(false, 401, null);
        }
        if (role == null || !"API_PROVIDER".equals(role)) {
            return new AuthContext(false, 403, userId);
        }
        return new AuthContext(true, 200, userId);
    }

    private static class AuthContext {
        private final boolean allowed;
        private final int status;
        private final Long userId;

        private AuthContext(boolean allowed, int status, Long userId) {
            this.allowed = allowed;
            this.status = status;
            this.userId = userId;
        }
    }
}