package com.ordereasy.auth_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;
    private String role;

    // nullable = true so existing users (without phone) are not affected
    @Column(name = "phone_number", unique = true, nullable = true, length = 15)
    private String phoneNumber;
}
