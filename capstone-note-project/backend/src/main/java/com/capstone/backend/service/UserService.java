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

    public String findEmailByNicknameAndPhone(String nickname, String phone) {
        User user = userRepository
                .findByNicknameAndPhone(nickname, phone)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "일치하는 회원 정보를 찾을 수 없습니다."
                        )
                );

        return user.getEmail();
    }

    public User findByNicknameAndEmail(String nickname, String email) {
        User user = userRepository
                .findByNicknameAndEmail(nickname, email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "일치하는 회원 정보를 찾을 수 없습니다."
                        )
                );

        return user;
    }

    public void resetPassword(String email, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException(
                    "비밀번호가 일치하지 않습니다."
            );
        }

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "사용자를 찾을 수 없습니다."
                        )
                );
        
        // 기존 비밀번호와 동일한지 확인
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException(
                    "현재 사용 중인 비밀번호와 동일한 비밀번호는 사용할 수 없습니다."
            );
        }

        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "이메일 또는 비밀번호가 일치하지 않습니다."
                        )
                );

        if (!passwordEncoder.matches(
                password,
                user.getPassword()
        )) {
            throw new IllegalArgumentException(
                    "이메일 또는 비밀번호가 일치하지 않습니다."
            );
        }

        return user;
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "사용자를 찾을 수 없습니다."
                        )
                );
    }
}
