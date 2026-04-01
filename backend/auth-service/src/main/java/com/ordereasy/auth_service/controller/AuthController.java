package com.ordereasy.auth_service.controller;

import com.ordereasy.auth_service.dto.LoginRequest;
import com.ordereasy.auth_service.dto.SignupRequest;
import com.ordereasy.auth_service.dto.SignupResponse;
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
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/auth/signup")
    public SignupResponse signup(@RequestBody SignupRequest request) {

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());

        User savedUser = userService.saveUser(user);

        return new SignupResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole()
        );
    }

    @PostMapping("/auth/login")
    public String login(@RequestBody LoginRequest request) {
        User user = userService.loginUser(
                request.getEmail(),
                request.getPassword()
        );

        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }

    @GetMapping("/test")
    public String test() {
        return "Protected API Working";
    }
}