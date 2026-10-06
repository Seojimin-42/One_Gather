package com.capstone.backend.controller;

import com.capstone.backend.dto.*;
import com.capstone.backend.entity.User;
import com.capstone.backend.repository.UserRepository;
import com.capstone.backend.service.UserService;
import com.capstone.backend.service.VerificationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final VerificationService verificationSerivce;
    private final UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignUpRequestDto signUpRequestDto) {
        userService.create(signUpRequestDto);

        return ResponseEntity.ok("회원가입이 완료되었습니다.");
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname) {
        boolean duplicate = userService.isNicknameDuplicate(nickname);

        return ResponseEntity.ok(duplicate);
    }

    @PostMapping("/signup/validate")
    public ResponseEntity<String> validateSignup(@Valid @RequestBody SignUpRequestDto signUpRequestDto) {
        return ResponseEntity.ok("검증 완료");
    }

    @PostMapping("/find-id")
    public ResponseEntity<String> findId(@Valid @RequestBody FindIdRequestDto findIdRequestDto) {
        String email = userService.findEmailByNicknameAndPhone(
                findIdRequestDto.getNickname(),
                findIdRequestDto.getPhone()
        );

        return ResponseEntity.ok(email);
    }

    // 아이디 찾기용
    @PostMapping("/find-id/send-code")
    public ResponseEntity<String> sendFindIdCode(@Valid @RequestBody FindIdRequestDto requestDto) {
        userService.findEmailByNicknameAndPhone(
                requestDto.getNickname(),
                requestDto.getPhone()
        );

        String code = verificationSerivce.createCode(requestDto.getPhone());

        System.out.println("============== [개발용 전화번호 인증번호] " + code);

        return ResponseEntity.ok("인증번호가 발송되었습니다.");
    }

    // 아이디 찾기 확인
    @PostMapping("/find-id/verify-code")
    public ResponseEntity<String> verifyFindIdCode(@Valid @RequestBody VerifyCodeRequestDto requestDto) {
        boolean verified = verificationSerivce.verifyCode(
                requestDto.getPhone(),
                requestDto.getCode()
        );

        if (!verified) {
            throw new IllegalArgumentException(
                    "인증번호가 올바르지 않거나 만료되었습니다."
            );
        }

        String email = userService.findEmailByNicknameAndPhone(
                requestDto.getNickname(),
                requestDto.getPhone()
        );

        return ResponseEntity.ok(email);
    }

    // 비밀번호 찾기용 (휴대폰 번호)
    @PostMapping("/find-pw/send-code")
    public ResponseEntity<String> sendFindPwCode(@Valid @RequestBody FindIdRequestDto requestDto) {
        userService.findEmailByNicknameAndPhone(
                requestDto.getNickname(),
                requestDto.getPhone()
        );

        String code = verificationSerivce.createCode(requestDto.getPhone());

        System.out.println("============== [개발용 전화번호 인증번호] " + code);

        return ResponseEntity.ok("인증번호가 발송되었습니다.");
    }

    // 비밀번호 찾기 확인 (휴대폰 번호)
    @PostMapping("/find-pw/verify-code")
    public ResponseEntity<String> verifyFindPwCode(@Valid @RequestBody VerifyCodeRequestDto requestDto) {
        boolean verified = verificationSerivce.verifyCode(
                requestDto.getPhone(),
                requestDto.getCode()
        );

        if (!verified) {
            throw new IllegalArgumentException(
                    "인증번호가 올바르지 않거나 만료되었습니다."
            );
        }

        String email = userService.findEmailByNicknameAndPhone(
                requestDto.getNickname(),
                requestDto.getPhone()
        );

        return ResponseEntity.ok(email);
    }

    // 비밀번호 찾기용 (이메일)
    @PostMapping("/find-pw/send-email-code")
    public ResponseEntity<String> sendFindPwEmailCode(@Valid @RequestBody FindPwByEmailRequestDto requestDto) {
        userService.findByNicknameAndEmail(
                requestDto.getNickname(),
                requestDto.getEmail()
        );

        String code = verificationSerivce.createCode(requestDto.getEmail());

        System.out.println("============== [개발용 이메일 인증번호] " + code);

        return ResponseEntity.ok("인증번호가 발송되었습니다.");
    }

    // 비밀번호 찾기 확인 (이메일)
    @PostMapping("/find-pw/verify-email-code")
    public ResponseEntity<String> verifyFindPwEmailCode(@Valid @RequestBody VerifyEmailCodeRequestDto requestDto) {
        boolean verified = verificationSerivce.verifyCode(
                requestDto.getEmail(),
                requestDto.getCode()
        );

        if (!verified) {
            throw new IllegalArgumentException(
                    "인증번호가 올바르지 않거나 만료되었습니다."
            );
        }

        userService.findByNicknameAndEmail(
                requestDto.getNickname(),
                requestDto.getEmail()
        );

        return ResponseEntity.ok("인증이 완료되었습니다.");
    }
    
    // 비밀번호 재설정
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequestDto requestDto) {
        userService.resetPassword(
                requestDto.getEmail(),
                requestDto.getNewPassword(),
                requestDto.getConfirmPassword()
        );

        return ResponseEntity.ok(
                "비밀번호 변경이 완료되었습니다."
        );
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto requestDto,
                                                  HttpSession session) {
        User user = userService.login(
                requestDto.getEmail(),
                requestDto.getPassword()
        );

        session.setAttribute("loginUserId", user.getId());

        LoginResponseDto responseDto =
                new LoginResponseDto(
                              user.getId(),
                              user.getEmail(),
                              user.getNickname()
                        );

        return ResponseEntity.ok(responseDto);
    }
    
    // 페이지 새로고침 시 로그인 확인
    @GetMapping("/me")
    public ResponseEntity<LoginResponseDto> getCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException(
                   "로그인이 필요합니다."
            );
        }

        User user = userService.findById(userId);

        LoginResponseDto responseDto =
                new LoginResponseDto(
                        user.getId(),
                        user.getEmail(),
                        user.getNickname()
                );

        return ResponseEntity.ok(responseDto);
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpSession session) {
        session.invalidate();

        return ResponseEntity.ok(
                "로그아웃이 완료되었습니다."
        );
    }
}
