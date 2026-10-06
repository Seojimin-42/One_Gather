package com.capstone.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class FindIdRequestDto {

    @NotEmpty(message = "닉네임을 입력해주세요.")
    private String nickname;

    @NotEmpty(message = "휴대폰 번호를 입력해주세요.")
    @Pattern(
            regexp = "^[0-9]{11}$",
            message = "휴대폰 번호는 숫자 11자리로 입력해주세요."
    )
    private String phone;
}
