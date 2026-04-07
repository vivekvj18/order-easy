package com.ordereasy.delivery_service.controller;

import com.ordereasy.delivery_service.dto.DeliveryResponse;
import com.ordereasy.delivery_service.dto.UpdateDeliveryStatusRequest;
import com.ordereasy.delivery_service.service.DeliveryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService)
    {
        this.deliveryService=deliveryService;
    }

    @GetMapping
    public List<DeliveryResponse> getAllDeliveries(){
        return deliveryService.getAllDeliveries();

    }

    @GetMapping("/{orderId}")
    public DeliveryResponse getDeliveryByOrderId(@PathVariable Long orderId)
    {
        return deliveryService.getDeliveryByOrderId(orderId);
    }

    @PatchMapping("/{deliveryId}/status")
    public DeliveryResponse updateDeliveryStatus(
            @PathVariable Long deliveryId,
            @RequestBody UpdateDeliveryStatusRequest request) {

        return deliveryService.updateDeliveryStatus(deliveryId, request.getStatus());

    }
}
