package com.smartbackend.smart_control_system.repository;

import com.smartbackend.smart_control_system.entity.Api;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApiRepository extends JpaRepository<Api, Long> {

    Optional<Api> findByBasePath(String basePath);

    Optional<Api> findByName(String name);

    Optional<Api> findByNameIgnoreCase(String name);

    Optional<Api> findBySlug(String slug);

    Optional<Api> findBySlugAndVersion(String slug, String version);

        @Query("""
                        SELECT a
                        FROM Api a
                        WHERE a.slug = :slug
                            AND (a.version = :version OR a.version IS NULL)
                        """)
        Optional<Api> findBySlugAndVersionOrVersionIsNull(@Param("slug") String slug, @Param("version") String version);

    List<Api> findAllBySlug(String slug);

        Optional<Api> findByProvider_IdAndSlugAndVersion(Long providerId, String slug, String version);

        @Query("""
                SELECT a
                FROM Api a
                WHERE a.provider.id = :providerId
                    AND a.slug = :slug
                    AND (a.version = :version OR a.version IS NULL)
        """)
        Optional<Api> findByProviderAndSlugAndVersionOrNull(
                        @Param("providerId") Long providerId,
                        @Param("slug") String slug,
                        @Param("version") String version
        );

    long countByActiveTrue();

    List<Api> findByProvider_Id(Long providerId);
}