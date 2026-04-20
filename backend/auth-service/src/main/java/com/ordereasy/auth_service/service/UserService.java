package com.ordereasy.auth_service.service;

import com.ordereasy.auth_service.entity.User;
import com.ordereasy.auth_service.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User saveUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    /**
     * Dual login: tries phone number first, then falls back to email.
     * This supports both the new phone login flow and the old email login flow.
     *
     * @param identifier — can be a 10-digit phone number OR an email address
     * @param password   — plain-text password to verify
     */
    public User loginUser(String identifier, String password) {

        // Step 1: Try to find user by phone number first
        User user = userRepository.findByPhoneNumber(identifier)
                .orElseGet(() ->
                        // Step 2: If not found by phone, try email
                        userRepository.findByEmail(identifier)
                                .orElseThrow(() -> new RuntimeException("User not found with this phone number or email"))
                );

        // Step 3: Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // Step 4: Return authenticated user
        return user;
    }
}

