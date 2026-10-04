package com.capstone.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignUpRequestDto {

    @NotEmpty(message = "이메일은 필수 항목입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotEmpty(message = "비밀번호는 필수 항목입니다.")
    @Size(min = 4, message = "비밀번호는 4자 이상으로 입력하세요.")
    private String password;

    @NotEmpty(message = "비밀번호 확인은 필수 항목입니다.")
    private String passwordConfirm;

    @NotEmpty(message = "닉네임은 필수 항목입니다.")
    @Size(max = 10, message = "닉네임은 최대 10글자까지 입력할 수 있습니다.")
    private String nickname;

    @NotEmpty(message = "휴대폰 번호는 필수 항목입니다.")
    @Pattern(
            regexp = "^[0-9]{11}$",
            message = "휴대폰 번호는 숫자 11자리로 입력해주세요."
    )
    private String phone;
}
