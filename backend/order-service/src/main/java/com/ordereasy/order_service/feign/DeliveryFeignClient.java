package com.ordereasy.order_service.feign;

import com.ordereasy.order_service.dto.DeliveryAssignmentRequest;
import com.ordereasy.order_service.dto.DeliveryAssignmentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client for calling Delivery Service's partner assignment endpoint.
 * The base URL is resolved from application.properties: delivery.service.url
 * Target endpoint: POST /deliveries/assign
 */
@FeignClient(name = "delivery-service")
public interface DeliveryFeignClient {

    @PostMapping("/deliveries/assign")
    DeliveryAssignmentResponse assignDelivery(@RequestBody DeliveryAssignmentRequest request);
}
