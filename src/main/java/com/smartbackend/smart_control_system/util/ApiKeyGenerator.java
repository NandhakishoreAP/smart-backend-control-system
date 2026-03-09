package com.smartbackend.smart_control_system.util;

import java.security.SecureRandom;
import java.util.Base64;

public class ApiKeyGenerator {

    private static final SecureRandom secureRandom = new SecureRandom();

    public static String generateKey() {

        byte[] randomBytes = new byte[32];

        secureRandom.nextBytes(randomBytes);

        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(randomBytes);
    }
}