package com.capstone.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(unique = true, nullable = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false, length = 10)
    private String nickname;

    @Column(nullable = false)
    private String phone;

    public User(String email, String password, String nickname, String phone) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.phone = phone;
    }
}

