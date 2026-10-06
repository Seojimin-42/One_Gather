package com.capstone.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ResetPasswordRequestDto {

    @NotEmpty(message = "이메일은 필수 항목입니다.")
    private String email;

    @NotEmpty(message = "새 비밀번호는 필수 항목입니다.")
    @Size(min = 4, message = "비밀번호는 4자 이상으로 입력하세요.")
    @Pattern(
            regexp = "^(?!.*\\s).*$",
            message = "비밀번호에는 공백을 입력할 수 없습니다."
    )
    private String newPassword;

    @NotEmpty(message = "비밀번호 확인은 필수 항목입니다.")
    private String confirmPassword;
}
