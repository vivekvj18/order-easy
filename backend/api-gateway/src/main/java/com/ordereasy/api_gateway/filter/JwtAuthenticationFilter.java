package com.ordereasy.api_gateway.filter;

import io.jsonwebtoken.Claims;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        // ✅ TEMPORARY: Sab routes public — gateway routing test ke liye
        // TODO: Auth add karna hai baad mein
//        return chain.filter(exchange);




        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Public routes skip
        if (path.startsWith("/auth")) {
            return chain.filter(exchange);
        }

        // Header extract
        String authHeader = request.getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(exchange, "Missing or Invalid Authorization Header", HttpStatus.UNAUTHORIZED);
        }

        // Token extract
        String token = authHeader.substring(7);

        // JWT validation
        Claims claims;
        try {
            claims = jwtUtil.validateToken(token);
        } catch (Exception e) {
            return onError(exchange, "Invalid or Expired JWT Token", HttpStatus.UNAUTHORIZED);
        }

        // ROLE EXTRACT
        String role = claims.get("role", String.class);

        // CUSTOMER rules
        if (path.startsWith("/orders") && !"CUSTOMER".equals(role) && !"ADMIN".equals(role)) {
            return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
        }

        // ADMIN only routes
        if (path.startsWith("/admin") && !"ADMIN".equals(role)) {
            return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
        }

        // Products
        if (path.startsWith("/products") && request.getMethod().name().equals("GET")) {
            if (!"CUSTOMER".equals(role) && !"ADMIN".equals(role)) {
                return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
            }
        } else if (path.startsWith("/products") || path.startsWith("/stock")) {
            if (!"ADMIN".equals(role)) {
                return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
            }
        }

        // Tracking routes
        if (path.matches("/tracking/\\d+/history")) {
            if (!"ADMIN".equals(role)) {
                return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
            }
        } else if (path.equals("/tracking/update") || path.startsWith("/tracking/update")) {
            if (!"DELIVERY_PARTNER".equals(role) && !"ADMIN".equals(role)) {
                return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
            }
        } else if (path.startsWith("/tracking")) {
            if (!"CUSTOMER".equals(role) && !"ADMIN".equals(role) && !"DELIVERY_PARTNER".equals(role)) {
                return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
            }
        }

        // Deliveries — ADMIN + DELIVERY_PARTNER
        if (path.startsWith("/deliveries")) {
            if (!"ADMIN".equals(role) && !"DELIVERY_PARTNER".equals(role)) {
                return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
            }
        }

        //Notification

        if (path.startsWith("/notifications")) {
            if (!role.equals("CUSTOMER") && !role.equals("ADMIN")) {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }
        }

        return chain.filter(exchange);

    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus status) {
        exchange.getResponse().setStatusCode(status);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -1;
    }
}