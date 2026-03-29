package com.ordereasy.auth_service.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class JwtFilter extends OncePerRequestFilter {

    // 🔐 SAME SECRET KEY (must match JwtUtil)
    @Value("${jwt.secret}")
    private String secretKey;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 🔹 Step 1: Get Authorization header
        String authHeader = request.getHeader("Authorization");

        String token = null;

        // 🔹 Step 2: Extract token (remove "Bearer ")
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        try {
            // 🔹 Step 3: Validate token if present
            if (token != null) {

                String email = Jwts.parserBuilder()
                        .setSigningKey(Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseClaimsJws(token)
                        .getBody()
                        .getSubject();           // extract email

                // 🔹 Step 4: Create authentication object
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(email, null, null);

                // 🔹 Step 5: Set authentication in Spring Security context
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }

        } catch (Exception e) {
            // ❌ If token invalid / expired → clear context
            SecurityContextHolder.clearContext();
        }

        // 🔹 Step 6: Continue request flow
        filterChain.doFilter(request, response);
    }
}