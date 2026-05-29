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

        // 🟢 CORS Preflight bypass
        if (request.getMethod().name().equals("OPTIONS")) {
            return chain.filter(exchange);
        }

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

        // CLAIMS EXTRACT — subject = email; userId is a separate custom claim
        String role  = claims.get("role", String.class);
        Object userIdObj = claims.get("userId");
        String userId = userIdObj != null ? String.valueOf(userIdObj) : null;
        String email  = claims.getSubject();

        // CUSTOMER rules (Riders allowed to update status)
        if (path.startsWith("/orders")) {
            boolean isStatusUpdate = path.endsWith("/status") || path.contains("/status?");
            if (!"CUSTOMER".equals(role) && !"ADMIN".equals(role) && !("DELIVERY_PARTNER".equals(role) && isStatusUpdate)) {
                return onError(exchange, "Access Denied", HttpStatus.FORBIDDEN);
            }
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

        // Deliveries — customers may read assignment details for their orders;
        // delivery partners/admins can use the operational delivery endpoints.
        if (path.startsWith("/deliveries")) {
            boolean isReadRequest = request.getMethod().name().equals("GET");
            if (!"ADMIN".equals(role) && !"DELIVERY_PARTNER".equals(role) && !("CUSTOMER".equals(role) && isReadRequest)) {
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

        // Strip any client-supplied spoofable headers, then inject verified values from JWT.
        // X-Internal-Service is also stripped — clients must never impersonate internal services.
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove("X-User-Id");
                    headers.remove("X-User-Role");
                    headers.remove("X-User-Email");
                    headers.remove("X-Internal-Service");   // never forward — only internal Feign adds this
                    if (userId != null) headers.add("X-User-Id",    userId);
                    if (role   != null) headers.add("X-User-Role",  role);
                    if (email  != null) headers.add("X-User-Email", email);
                })
                .build();
        return chain.filter(exchange.mutate().request(mutatedRequest).build());

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
