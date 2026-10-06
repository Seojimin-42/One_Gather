package com.capstone.backend.service;

import com.capstone.backend.dto.VerificationDto;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VerificationService {

    private final Map<String, VerificationDto> verificationStore = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    public String createCode(String target) {

        String code = String.format(
                "%06d",
                secureRandom.nextInt(1000000)
        );

        VerificationDto verificationDto = new VerificationDto(code, LocalDateTime.now().plusMinutes(3));

            verificationStore.put(target, verificationDto);

            return code;
    }

    public boolean verifyCode(String phone, String code) {
        VerificationDto verificationDto = verificationStore.get(phone);

        if (verificationDto == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(verificationDto.getExpiresAt())) {

            verificationStore.remove(phone);
            return false;
        }

        if (!verificationDto.getCode().equals(code)) {
            return false;
        }

        verificationStore.remove(phone);

        return true;
    }
}
