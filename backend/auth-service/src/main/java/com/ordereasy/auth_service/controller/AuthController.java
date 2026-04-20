package com.ordereasy.auth_service.controller;

import com.ordereasy.auth_service.dto.LoginRequest;
import com.ordereasy.auth_service.dto.OtpRequest;
import com.ordereasy.auth_service.dto.OtpVerifyRequest;
import com.ordereasy.auth_service.dto.SignupRequest;
import com.ordereasy.auth_service.dto.SignupResponse;
import com.ordereasy.auth_service.entity.User;
import com.ordereasy.auth_service.repository.UserRepository;
import com.ordereasy.auth_service.security.JwtUtil;
import com.ordereasy.auth_service.service.TwilioService;
import com.ordereasy.auth_service.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final TwilioService twilioService;
    private final UserRepository userRepository;

    public AuthController(UserService userService, JwtUtil jwtUtil,
                          TwilioService twilioService, UserRepository userRepository) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.twilioService = twilioService;
        this.userRepository = userRepository;
    }

    // ─── REGISTRATION ──────────────────────────────────────────────────────────

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

    // ─── PASSWORD LOGIN (fallback — kept unchanged) ─────────────────────────────

    @PostMapping("/auth/login")
    public String login(@RequestBody LoginRequest request) {

        String identifier = (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank())
                ? request.getPhoneNumber()
                : request.getEmail();

        if (identifier == null || identifier.isBlank()) {
            throw new RuntimeException("Please provide phone number or email to login");
        }

        User user = userService.loginUser(identifier, request.getPassword());
        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }

    // ─── OTP LOGIN: STEP 1 — Send OTP ──────────────────────────────────────────

    @PostMapping("/auth/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody OtpRequest request) {

        // Check if user exists with this phone number before wasting OTP credits
        userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new RuntimeException(
                        "No account found with this phone number. Please register first."));

        // Send OTP via Twilio Verify
        twilioService.sendOtp(request.getPhoneNumber());

        return ResponseEntity.ok(Map.of(
                "message", "OTP sent successfully to your phone number",
                "phone",   request.getPhoneNumber()
        ));
    }

    // ─── OTP LOGIN: STEP 2 — Verify OTP & return JWT ───────────────────────────

    @PostMapping("/auth/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {

        // Verify OTP with Twilio
        boolean isValid = twilioService.verifyOtp(request.getPhoneNumber(), request.getOtp());

        if (!isValid) {
            throw new RuntimeException("Invalid or expired OTP. Please try again.");
        }

        // OTP verified — find the user and generate JWT
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new RuntimeException(
                        "User not found. Please register first."));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "role",  user.getRole()
        ));
    }

    // ─── TEST ───────────────────────────────────────────────────────────────────

    @GetMapping("/test")
    public String test() {
        return "Protected API Working";
    }
}