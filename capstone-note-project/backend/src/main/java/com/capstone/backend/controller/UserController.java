package com.capstone.backend.controller;

import com.capstone.backend.dto.SignUpRequestDto;
import com.capstone.backend.repository.UserRepository;
import com.capstone.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
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
}
