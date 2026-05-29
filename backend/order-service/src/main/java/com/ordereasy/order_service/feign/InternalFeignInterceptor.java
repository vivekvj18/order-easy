package com.ordereasy.order_service.feign;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Injects X-Internal-Service on every outgoing Feign call from Order Service.
 * This allows downstream services (e.g. Cart Service) to identify and trust
 * service-to-service calls without requiring a user JWT.
 *
 * The header is NOT forwarded by the Gateway — it is set only here, inside the
 * trusted service boundary, using a shared secret from the environment.
 */
@Component
public class InternalFeignInterceptor implements RequestInterceptor {

    @Value("${internal.service.secret}")
    private String internalSecret;

    @Override
    public void apply(RequestTemplate template) {
        template.header("X-Internal-Service", internalSecret);
    }
}
