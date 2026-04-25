package com.ordereasy.delivery_service.controller;

import com.ordereasy.delivery_service.dto.DeliveryAssignmentRequest;
import com.ordereasy.delivery_service.dto.DeliveryAssignmentResponse;
import com.ordereasy.delivery_service.dto.DeliveryResponse;
import com.ordereasy.delivery_service.dto.UpdateDeliveryStatusRequest;
import com.ordereasy.delivery_service.service.DeliveryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GetMapping
    public List<DeliveryResponse> getAllDeliveries() {
        log.info("Received request to fetch all deliveries");
        List<DeliveryResponse> deliveries = deliveryService.getAllDeliveries();
        log.info("Returning {} deliveries", deliveries.size());
        return deliveries;
    }

    @GetMapping("/{orderId}")
    public DeliveryResponse getDeliveryByOrderId(@PathVariable Long orderId) {
        log.info("Received request to fetch delivery for orderId: {}", orderId);
        DeliveryResponse response = deliveryService.getDeliveryByOrderId(orderId);
        log.info("Returning delivery for orderId: {} with status: {}", orderId, response.getStatus());
        return response;
    }

    @PatchMapping("/{deliveryId}/status")
    public DeliveryResponse updateDeliveryStatus(
            @PathVariable Long deliveryId,
            @RequestBody UpdateDeliveryStatusRequest request) {
        log.info("Received request to update delivery: {} to status: {}", deliveryId, request.getStatus());
        DeliveryResponse response = deliveryService.updateDeliveryStatus(deliveryId, request.getStatus());
        log.info("Delivery: {} status updated successfully to: {}", deliveryId, request.getStatus());
        return response;
    }

    @PostMapping("/assign")
    public ResponseEntity<DeliveryAssignmentResponse> assignDelivery(
            @RequestBody DeliveryAssignmentRequest request) {
        log.info("Received request to assign delivery for orderId: {}", request.getOrderId());
        DeliveryAssignmentResponse response = deliveryService.assignDeliveryForOrder(request);
        log.info("Delivery assigned successfully for orderId: {}", request.getOrderId());
        return ResponseEntity.ok(response);
    }
}