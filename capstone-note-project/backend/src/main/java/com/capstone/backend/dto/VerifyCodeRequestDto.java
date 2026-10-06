package com.capstone.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class VerifyCodeRequestDto {

    @NotEmpty(message = "닉네임을 입력해주세요.")
    private String nickname;

    @NotEmpty(message = "휴대폰 번호를 입력해주세요.")
    @Pattern(
            regexp = "^[0-9]{11}$",
            message = "휴대폰 번호는 숫자 11자리로 입력해주세요."
    )
    private String phone;

    @NotEmpty(message = "인증번호를 입력해주세요.")
    @Pattern(
            regexp = "^[0-9]{6}$",
            message = "인증번호는 숫자 6자리로 입력해주세요."
    )
    private String code;
}
