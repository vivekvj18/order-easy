package com.ordereasy.auth_service.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // 🔐 Secret key (application.properties se aayega)
    @Value("${jwt.secret}")
    private String secretKey;

    // 🔥 Generate JWT with email + role
    public String generateToken(String email, String role) {

        return Jwts.builder()

                // 👤 User identity
                .setSubject(email)

                // 🔥 ROLE ADD (MOST IMPORTANT)
                .claim("role", role)

                // 🕒 Token creation time
                .setIssuedAt(new Date())

                // ⏳ Expiry (1 hour)
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))

                // 🔐 Sign token
                .signWith(Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8)))

                // 🎯 Final token
                .compact();
    }
}