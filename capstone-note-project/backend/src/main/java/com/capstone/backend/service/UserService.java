package com.capstone.backend.service;

import com.capstone.backend.dto.SignUpRequestDto;
import com.capstone.backend.entity.User;
import com.capstone.backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void create(@Valid SignUpRequestDto signUpRequestDto) {

        if (!signUpRequestDto.getPassword()
                .equals(signUpRequestDto.getPasswordConfirm())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        if(userRepository.existsByEmail(signUpRequestDto.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = User.builder()
                .email(signUpRequestDto.getEmail())
                .password(passwordEncoder.encode(signUpRequestDto.getPassword()))
                .nickname(signUpRequestDto.getNickname())
                .phone(signUpRequestDto.getPhone())
                .build();

        userRepository.save(user);
    }

    public boolean isNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }
}
