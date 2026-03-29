package com.smartbackend.smart_control_system.service;

import com.smartbackend.smart_control_system.dto.ApiResponse;
import com.smartbackend.smart_control_system.entity.Api;
import com.smartbackend.smart_control_system.entity.ResetInterval;
import com.smartbackend.smart_control_system.entity.User;
import com.smartbackend.smart_control_system.repository.ApiRepository;
import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;
import com.smartbackend.smart_control_system.repository.ApiHealthLogRepository;
import com.smartbackend.smart_control_system.repository.ApiEndpointRepository;
import com.smartbackend.smart_control_system.repository.ApiRequestLogRepository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ApiService {

    private final ApiRepository apiRepository;
    private final ApiSubscriptionRepository apiSubscriptionRepository;
    private final ApiHealthLogRepository apiHealthLogRepository;
    private final ApiEndpointRepository apiEndpointRepository;
    private final ApiRequestLogRepository apiRequestLogRepository;

    public ApiService(ApiRepository apiRepository,
                      ApiSubscriptionRepository apiSubscriptionRepository,
                      ApiHealthLogRepository apiHealthLogRepository,
                      ApiEndpointRepository apiEndpointRepository,
                      ApiRequestLogRepository apiRequestLogRepository) {
        this.apiRepository = apiRepository;
        this.apiSubscriptionRepository = apiSubscriptionRepository;
        this.apiHealthLogRepository = apiHealthLogRepository;
        this.apiEndpointRepository = apiEndpointRepository;
        this.apiRequestLogRepository = apiRequestLogRepository;
    }

public Api createApi(String name,
                     String description,
                     String slug,
                     String version,
                     Integer rateLimit,
                     String upstreamUrl,
                     Integer violationThreshold,
                     Integer violationWindowSeconds,
                     Integer blockDurationSeconds,
                     Integer usageThresholdPercent,
                     String resetInterval,
                     User provider) {

    Api api = new Api();

    api.setName(name);
    String resolvedSlug = slug == null || slug.isBlank()
            ? name.toLowerCase().replace(" ", "-")
            : slug.toLowerCase().replace(" ", "-");
    String resolvedVersion = normalizeVersion(version);
    String basePath = "/" + resolvedSlug + "/" + resolvedVersion;

    if (provider != null && provider.getId() != null) {
        Optional<Api> existing = apiRepository.findByProvider_IdAndSlugAndVersion(
                provider.getId(),
                resolvedSlug,
                resolvedVersion
        );
        if (existing.isPresent()) {
            throw new IllegalArgumentException("API version already exists");
        }
    }
    if (apiRepository.findByBasePath(basePath).isPresent()) {
        throw new IllegalArgumentException("API base path already exists");
    }

    api.setSlug(resolvedSlug);
    api.setVersion(resolvedVersion);
    api.setBasePath(basePath);
    api.setDescription(description);
    api.setProvider(provider);
    api.setRateLimit(rateLimit == null ? 100 : rateLimit);
    api.setUpstreamUrl(upstreamUrl);
    api.setActive(true);
    if (violationThreshold != null) {
        api.setViolationThreshold(violationThreshold);
    }
    if (violationWindowSeconds != null) {
        api.setViolationWindowSeconds(violationWindowSeconds);
    }
    if (blockDurationSeconds != null) {
        api.setBlockDurationSeconds(blockDurationSeconds);
    }
    if (usageThresholdPercent != null) {
        api.setUsageThresholdPercent(usageThresholdPercent);
    }
    api.setResetInterval(resolveResetInterval(resetInterval));

    return apiRepository.save(api);
}

    public List<Api> getAllApis() {
        return apiRepository.findAll();
    }

    public List<ApiResponse> getMarketplaceApis() {

    return apiRepository.findAll()
            .stream()
            .filter(Api::isActive)
            .map(this::convertToResponse)
            .toList();
}

public ApiResponse getApiDetails(String slug) {
    Api api = resolveLatestBySlug(slug);
    return convertToResponse(api);
}

public ApiResponse getApiDetails(String slug, String version) {
    Api api = findBySlugAndVersion(slug, version)
            .orElseThrow(() -> new RuntimeException("API not found"));
    return convertToResponse(api);
}

    public ApiResponse convertToResponse(Api api) {

    ApiResponse response = new ApiResponse();

    response.setId(api.getId());
    response.setName(api.getName());
    response.setSlug(api.getSlug());
    String resolvedVersion = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
    response.setVersion(resolvedVersion);
    response.setDescription(api.getDescription());
    response.setActive(api.isActive());
    response.setRateLimit(api.getRateLimit());
    response.setViolationThreshold(defaultInt(api.getViolationThreshold(), 3));
    response.setViolationWindowSeconds(defaultInt(api.getViolationWindowSeconds(), 300));
    response.setBlockDurationSeconds(defaultInt(api.getBlockDurationSeconds(), 900));
    response.setUsageThresholdPercent(defaultInt(api.getUsageThresholdPercent(), 80));
    response.setResetInterval(resolveResetIntervalName(api.getResetInterval()));
    response.setUpstreamUrl(api.getUpstreamUrl());
    response.setProviderId(api.getProvider() == null ? null : api.getProvider().getId());
    response.setCreatedAt(api.getCreatedAt() == null ? null : api.getCreatedAt().toString());

    // Mock Response
    response.setMockResponseEnabled(api.isMockResponseEnabled());
    response.setMockResponseBody(api.getMockResponseBody());
    response.setMockResponseStatus(api.getMockResponseStatus());

    // Mock API
    response.setMockedApi(api.isMockedApi());
    response.setOriginalApiId(api.getOriginalApiId());

    return response;
}

    public List<ApiResponse> getApisByProvider(Long providerId) {
        return apiRepository.findByProvider_Id(providerId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public Api getApiForProvider(Long apiId, Long providerId) {
        Api api = apiRepository.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API not found"));
        if (api.getProvider() == null || !api.getProvider().getId().equals(providerId)) {
            throw new IllegalStateException("Not allowed to access this API");
        }
        return api;
    }

    public Api updateApi(Long apiId,
                         Long providerId,
                         String name,
                         String description,
                         String slug,
                         String version,
                         Integer rateLimit,
                         String upstreamUrl,
                         Boolean active,
                         Integer violationThreshold,
                         Integer violationWindowSeconds,
                         Integer blockDurationSeconds,
                         Integer usageThresholdPercent,
                         String resetInterval) {
        Api api = getApiForProvider(apiId, providerId);

        if (name != null && !name.isBlank()) {
            api.setName(name);
        }
        if (description != null) {
            api.setDescription(description);
        }
        if (rateLimit != null) {
            api.setRateLimit(rateLimit);
        }
        if (violationThreshold != null) {
            api.setViolationThreshold(violationThreshold);
        }
        if (violationWindowSeconds != null) {
            api.setViolationWindowSeconds(violationWindowSeconds);
        }
        if (blockDurationSeconds != null) {
            api.setBlockDurationSeconds(blockDurationSeconds);
        }
        if (usageThresholdPercent != null) {
            api.setUsageThresholdPercent(usageThresholdPercent);
        }
        if (resetInterval != null) {
            api.setResetInterval(resolveResetInterval(resetInterval));
        }
        if (active != null) {
            api.setActive(active);
        }
        if (upstreamUrl != null) {
            if (upstreamUrl.isBlank()) {
                throw new IllegalArgumentException("Upstream URL is required");
            }
            api.setUpstreamUrl(upstreamUrl);
        }

        if (slug != null) {
            String nextSlug = slug.isBlank()
                    ? (name != null && !name.isBlank() ? name.toLowerCase().replace(" ", "-") : api.getSlug())
                    : slug.toLowerCase().replace(" ", "-");
            api.setSlug(nextSlug);
            api.setBasePath("/" + nextSlug + "/" + resolveVersionForApi(api, version));
        }

        if (version != null && !version.isBlank()) {
            String nextVersion = normalizeVersion(version);
            api.setVersion(nextVersion);
            api.setBasePath("/" + api.getSlug() + "/" + nextVersion);
        }

        return apiRepository.save(api);
    }

    @Transactional
    public Api updateMockFields(Long apiId, Long providerId, Boolean isMockResponseEnabled, String mockResponseBody, Integer mockResponseStatus) {
        Api api = getApiForProvider(apiId, providerId);
        if (isMockResponseEnabled != null) {
            api.setMockResponseEnabled(isMockResponseEnabled);
        }
        if (mockResponseBody != null) {
            api.setMockResponseBody(mockResponseBody);
        }
        if (mockResponseStatus != null) {
            api.setMockResponseStatus(mockResponseStatus);
        }
        return apiRepository.save(api);
    }

    @Transactional
    public Api duplicateAsMock(Long originalApiId, Long providerId) {
        Api original = getApiForProvider(originalApiId, providerId);

        // Check if a mock already exists for this provider and original API
        apiRepository.findByProvider_Id(providerId).stream()
                .filter(a -> a.isMockedApi() && originalApiId.equals(a.getOriginalApiId()))
                .findFirst()
                .ifPresent(a -> {
                    throw new IllegalArgumentException("A mocked version for this API already exists in your workspace.");
                });

        String mockSlug = original.getSlug() + "-mock";
        String mockVersion = original.getVersion() != null ? original.getVersion() : "v1";
        String mockBasePath = "/" + mockSlug + "/" + mockVersion;

        // Ensure global basePath uniqueness
        if (apiRepository.findByBasePath(mockBasePath).isPresent()) {
            throw new IllegalArgumentException("Cannot create mock: The endpoint path " + mockBasePath + " is already in use.");
        }

        Api mock = new Api();
        mock.setName("[Mocked] " + original.getName());
        mock.setDescription("Mocked version of " + original.getName() + " - " + (original.getDescription() != null ? original.getDescription() : ""));
        mock.setSlug(mockSlug);
        mock.setVersion(mockVersion);
        mock.setBasePath(mockBasePath);
        mock.setProvider(original.getProvider());
        mock.setRateLimit(original.getRateLimit());
        mock.setUpstreamUrl(original.getUpstreamUrl());
        mock.setActive(true);
        mock.setViolationThreshold(original.getViolationThreshold());
        mock.setViolationWindowSeconds(original.getViolationWindowSeconds());
        mock.setBlockDurationSeconds(original.getBlockDurationSeconds());
        mock.setUsageThresholdPercent(original.getUsageThresholdPercent());
        mock.setResetInterval(original.getResetInterval());

        // Mark as mocked
        mock.setMockedApi(true);
        mock.setOriginalApiId(original.getId());

        // Copy mock response fields if any
        mock.setMockResponseEnabled(original.isMockResponseEnabled());
        mock.setMockResponseBody(original.getMockResponseBody());
        mock.setMockResponseStatus(original.getMockResponseStatus());

        return apiRepository.save(mock);
    }

    @Transactional
    public Api replaceOriginalWithMock(Long mockApiId, Long providerId) {
        Api mock = getApiForProvider(mockApiId, providerId);
        if (!mock.isMockedApi() || mock.getOriginalApiId() == null) {
            throw new IllegalArgumentException("This is not a Mocked API");
        }

        Api original = getApiForProvider(mock.getOriginalApiId(), providerId);

        // Overwrite original properties
        original.setName(mock.getName().replace("[Mocked] ", ""));
        original.setDescription(mock.getDescription());
        original.setRateLimit(mock.getRateLimit());
        original.setUpstreamUrl(mock.getUpstreamUrl());
        original.setActive(mock.isActive());
        original.setViolationThreshold(mock.getViolationThreshold());
        original.setViolationWindowSeconds(mock.getViolationWindowSeconds());
        original.setBlockDurationSeconds(mock.getBlockDurationSeconds());
        original.setUsageThresholdPercent(mock.getUsageThresholdPercent());
        original.setResetInterval(mock.getResetInterval());
        original.setMockResponseEnabled(mock.isMockResponseEnabled());
        original.setMockResponseBody(mock.getMockResponseBody());
        original.setMockResponseStatus(mock.getMockResponseStatus());

        apiRepository.save(original);

        // Delete the mock
        deleteApi(mock.getId(), providerId);

        return original;
    }

    public List<Api> getProviderEntities(Long providerId) {
        return apiRepository.findByProvider_Id(providerId);
    }

    public Api toggleApiActive(Long apiId, Long providerId) {
        Api api = apiRepository.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API not found"));
        if (api.getProvider() == null || !api.getProvider().getId().equals(providerId)) {
            throw new IllegalStateException("Not allowed to update this API");
        }
        api.setActive(!api.isActive());
        return apiRepository.save(api);
    }

    @Transactional
    public void deleteApi(Long apiId, Long providerId) {
        Api api = apiRepository.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API not found"));
        if (api.getProvider() == null || !api.getProvider().getId().equals(providerId)) {
            throw new IllegalStateException("Not allowed to delete this API");
        }
        String version = api.getVersion() == null || api.getVersion().isBlank() ? "v1" : api.getVersion();
        String endpointPrefix = "/gateway/" + api.getSlug() + "/" + version + "%";
        apiRequestLogRepository.deleteByEndpointLike(endpointPrefix);
        apiSubscriptionRepository.deleteByApi_Id(apiId);
        apiHealthLogRepository.deleteByApi_Id(apiId);
        apiEndpointRepository.deleteByApi_Id(apiId);
        apiRepository.delete(api);
    }

    @Transactional
    public void deleteApiBySlugVersion(Long providerId, String slug, String version) {
        String resolvedSlug = slug == null ? null : slug.toLowerCase().replace(" ", "-");
        String resolvedVersion = normalizeVersion(version);

        Optional<Api> api = apiRepository.findByProvider_IdAndSlugAndVersion(providerId, resolvedSlug, resolvedVersion);
        if (api.isEmpty() && "v1".equals(resolvedVersion)) {
            api = apiRepository.findByProviderAndSlugAndVersionOrNull(providerId, resolvedSlug, resolvedVersion);
        }
        Api resolved = api.orElseThrow(() -> new RuntimeException("API not found"));
        Long apiId = resolved.getId();
        String endpointPrefix = "/gateway/" + resolvedSlug + "/" + resolvedVersion + "%";
        apiRequestLogRepository.deleteByEndpointLike(endpointPrefix);
        apiSubscriptionRepository.deleteByApi_Id(apiId);
        apiHealthLogRepository.deleteByApi_Id(apiId);
        apiEndpointRepository.deleteByApi_Id(apiId);
        apiRepository.delete(resolved);
    }

    // -------- NEW METHOD FOR GATEWAY --------

    @Cacheable(value = "apis", key = "#slug")
    public Api getApiBySlug(String slug) {
        return apiRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("API not found"));
    }

    @Cacheable(value = "apis", key = "#slug + ':' + #version")
    public Api getApiBySlugAndVersion(String slug, String version) {
        return findBySlugAndVersion(slug, version)
                .orElseThrow(() -> new RuntimeException("API not found"));
    }

    public List<String> getVersionsBySlug(String slug) {
        return apiRepository.findAllBySlug(slug)
                .stream()
                .map(Api::getVersion)
                .filter(value -> value != null && !value.isBlank())
                .map(this::normalizeVersion)
                .distinct()
                .sorted(this::compareVersions)
                .toList();
    }

    private Optional<Api> findBySlugAndVersion(String slug, String version) {
        String resolvedVersion = normalizeVersion(version);
        Optional<Api> direct = apiRepository.findBySlugAndVersion(slug, resolvedVersion);
        if (direct.isPresent()) {
            return direct;
        }
        if ("v1".equals(resolvedVersion)) {
            return apiRepository.findBySlugAndVersionOrVersionIsNull(slug, resolvedVersion);
        }
        return Optional.empty();
    }

    private Api resolveLatestBySlug(String slug) {
        List<Api> apis = apiRepository.findAllBySlug(slug);
        if (apis.isEmpty()) {
            throw new RuntimeException("API not found");
        }
        return apis.stream()
                .max((left, right) -> compareVersions(resolveVersionForApi(left, null), resolveVersionForApi(right, null)))
                .orElseThrow(() -> new RuntimeException("API not found"));
    }

    private String resolveVersionForApi(Api api, String override) {
        if (override != null && !override.isBlank()) {
            return normalizeVersion(override);
        }
        if (api.getVersion() != null && !api.getVersion().isBlank()) {
            return normalizeVersion(api.getVersion());
        }
        return "v1";
    }

    private String normalizeVersion(String version) {
        if (version == null || version.isBlank()) {
            return "v1";
        }
        String trimmed = version.trim();
        if (trimmed.startsWith("v") || trimmed.startsWith("V")) {
            return "v" + trimmed.substring(1).trim();
        }
        return "v" + trimmed;
    }

    private ResetInterval resolveResetInterval(String value) {
        if (value == null || value.isBlank()) {
            return ResetInterval.DAILY;
        }
        try {
            return ResetInterval.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ResetInterval.DAILY;
        }
    }

    private String resolveResetIntervalName(ResetInterval interval) {
        if (interval == null) {
            return ResetInterval.DAILY.name();
        }
        return interval.name();
    }

    private int compareVersions(String left, String right) {
        int leftNum = extractVersionNumber(left);
        int rightNum = extractVersionNumber(right);
        if (leftNum != rightNum) {
            return Integer.compare(leftNum, rightNum);
        }
        return left.compareToIgnoreCase(right);
    }

    private int extractVersionNumber(String version) {
        if (version == null) {
            return 0;
        }
        String normalized = version.trim();
        if (normalized.startsWith("v") || normalized.startsWith("V")) {
            normalized = normalized.substring(1);
        }
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < normalized.length(); i++) {
            char ch = normalized.charAt(i);
            if (Character.isDigit(ch)) {
                digits.append(ch);
            } else {
                break;
            }
        }
        if (digits.length() == 0) {
            return 0;
        }
        try {
            return Integer.parseInt(digits.toString());
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private int defaultInt(Integer value, int fallback) {
        return value == null ? fallback : value;
    }
}