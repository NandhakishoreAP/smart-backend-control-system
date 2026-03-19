package com.smartbackend.smart_control_system.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class NotificationTypeConverter implements AttributeConverter<NotificationType, String> {

    @Override
    public String convertToDatabaseColumn(NotificationType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public NotificationType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return NotificationType.INFO;
        }
        String normalized = dbData.trim().toUpperCase();
        return switch (normalized) {
            case "USER" -> NotificationType.INFO;
            case "ADMIN" -> NotificationType.WARNING;
            case "SYSTEM" -> NotificationType.ERROR;
            default -> NotificationType.valueOf(normalized);
        };
    }
}
