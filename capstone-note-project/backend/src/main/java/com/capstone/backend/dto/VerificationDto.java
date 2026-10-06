package com.capstone.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class VerificationDto {

    private String code;

    private LocalDateTime expiresAt;
}
