package com.ordereasy.auth_service.controller;

import com.ordereasy.auth_service.dto.LoginRequest;
import com.ordereasy.auth_service.dto.SignupRequest;
import com.ordereasy.auth_service.dto.SignupResponse;
import com.ordereasy.auth_service.entity.User;
import com.ordereasy.auth_service.security.JwtUtil;
import com.ordereasy.auth_service.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/auth/signup")
    public SignupResponse signup(@Valid @RequestBody SignupRequest request) {

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        user.setPhoneNumber(request.getPhoneNumber());

        User savedUser = userService.saveUser(user);

        return new SignupResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getPhoneNumber()
        );
    }

    @PostMapping("/auth/login")
    public String login(@RequestBody LoginRequest request) {

        // Determine the login identifier:
        // 1. If phoneNumber is provided, use it
        // 2. Otherwise fall back to email (backward compatibility)
        String identifier = (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank())
                ? request.getPhoneNumber()
                : request.getEmail();

        if (identifier == null || identifier.isBlank()) {
            throw new RuntimeException("Please provide phone number or email to login");
        }

        User user = userService.loginUser(identifier, request.getPassword());

        // JWT subject remains email — JWT flow is unchanged
        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }

    @GetMapping("/test")
    public String test() {
        return "Protected API Working";
    }
}