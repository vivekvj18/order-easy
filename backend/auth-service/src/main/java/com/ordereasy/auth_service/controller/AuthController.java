package com.ordereasy.auth_service.controller;

import com.ordereasy.auth_service.dto.LoginRequest;
import com.ordereasy.auth_service.entity.User;
import com.ordereasy.auth_service.security.JwtUtil;
import com.ordereasy.auth_service.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {

    private UserService userService;

    private JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil=jwtUtil;
    }

    @PostMapping("/auth/signup")
    public User signup(@RequestBody User user) {
        return userService.saveUser(user);
    }

    @PostMapping("/auth/login")
    public String login(@RequestBody LoginRequest request) {

        // Step 1: validate user
        userService.loginUser(
                request.getEmail(),
                request.getPassword()
        );

        // Step 2: generate token
        return jwtUtil.generateToken(request.getEmail());
    }

    @GetMapping("/test")
    public String test() {
        return "Protected API Working";
    }
}