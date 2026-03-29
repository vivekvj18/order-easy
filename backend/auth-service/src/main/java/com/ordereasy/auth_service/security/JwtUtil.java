package com.ordereasy.auth_service.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // 🔐 Secret key used to sign the JWT (should be kept secure)
    @Value("${jwt.secret}")
    private String secretKey;

    // 🔥 Method to generate JWT token using user email
    public String generateToken(String email) {

        return Jwts.builder()

                // 👤 Set user identity (who this token belongs to)
                .setSubject(email)

                // 🕒 Token creation time
                .setIssuedAt(new Date())

                // ⏳ Token expiration time (1 hour from now)
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 ))

                // 🔐 Sign the token using HS256 algorithm + secret key
                .signWith(Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8)))

                // 🎯 Build and return the final token string
                .compact();
    }
}