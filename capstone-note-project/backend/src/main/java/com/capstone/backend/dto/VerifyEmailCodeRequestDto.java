package com.capstone.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class VerifyEmailCodeRequestDto {

    @NotEmpty(message = "닉네임을 입력해주세요.")
    private String nickname;

    @NotEmpty(message = "이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotEmpty(message = "인증번호를 입력해주세요.")
    @Pattern(
            regexp = "^[0-9]{6}$",
            message = "인증번호는 숫자 6자리입니다."
    )
    private String code;
}
