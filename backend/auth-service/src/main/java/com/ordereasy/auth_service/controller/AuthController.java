package com.ordereasy.auth_service.controller;

import com.ordereasy.auth_service.dto.LoginRequest;
import com.ordereasy.auth_service.entity.User;
import com.ordereasy.auth_service.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {

    private UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/auth/signup")
    public User signup(@RequestBody User user) {
        return userService.saveUser(user);
    }

    @PostMapping("/auth/login")
    public User login(@RequestBody LoginRequest request) {

        return userService.loginUser(
                request.getEmail(),
                request.getPassword()
        );
    }
}