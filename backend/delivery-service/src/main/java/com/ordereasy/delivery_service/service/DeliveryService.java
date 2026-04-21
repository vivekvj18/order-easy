package com.ordereasy.delivery_service.service;

import com.ordereasy.delivery_service.dto.DeliveryAssignmentRequest;
import com.ordereasy.delivery_service.dto.DeliveryAssignmentResponse;
import com.ordereasy.delivery_service.dto.DeliveryResponse;
import com.ordereasy.delivery_service.entity.Delivery;
import com.ordereasy.delivery_service.entity.DeliveryPartner;
import com.ordereasy.delivery_service.entity.DeliveryStatus;
import com.ordereasy.delivery_service.entity.PartnerStatus;
import com.ordereasy.delivery_service.event.OrderCreatedEvent;
import com.ordereasy.delivery_service.event.PaymentCompletedEvent;
import com.ordereasy.delivery_service.event.OrderItemEvent;
import com.ordereasy.delivery_service.repository.DeliveryPartnerRepository;
import com.ordereasy.delivery_service.repository.DeliveryRepository;
import com.ordereasy.delivery_service.strategy.DeliveryAssignmentStrategy;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeliveryService {

    private final DeliveryPartnerRepository partnerRepository;
    private final DeliveryRepository deliveryRepository;
    private final DeliveryAssignmentStrategy assignmentStrategy;

    public DeliveryService(DeliveryPartnerRepository partnerRepository,
                           DeliveryRepository deliveryRepository,
                           DeliveryAssignmentStrategy assignmentStrategy) {
        this.partnerRepository = partnerRepository;
        this.deliveryRepository = deliveryRepository;
        this.assignmentStrategy = assignmentStrategy;
    }

    /**
     * Called by Order Service via Feign for synchronous partner assignment.
     * Returns success: false if no partner is available (no exception thrown)
     * so Order Service can handle gracefully and release reserved stock.
     */
    @Transactional
    public DeliveryAssignmentResponse assignDeliveryForOrder(DeliveryAssignmentRequest request) {

        List<DeliveryPartner> availablePartners = partnerRepository.findByStatus(PartnerStatus.AVAILABLE);

        // Return soft failure — caller (Order Service) decides to throw and release stock
        if (availablePartners == null || availablePartners.isEmpty()) {
            return DeliveryAssignmentResponse.builder()
                    .success(false)
                    .message("No delivery partner available at the moment. Please try again shortly.")
                    .build();
        }

        // FirstAvailableStrategy ignores the OrderCreatedEvent param (passing null is safe)
        DeliveryPartner selectedPartner = assignmentStrategy.assign(availablePartners, null);

        Delivery delivery = Delivery.builder()
                .orderId(request.getOrderId())
                .partner(selectedPartner)
                .status(DeliveryStatus.ASSIGNED)
                .assignedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Delivery savedDelivery = deliveryRepository.save(delivery);

        selectedPartner.setStatus(PartnerStatus.BUSY);
        partnerRepository.save(selectedPartner);

        return DeliveryAssignmentResponse.builder()
                .success(true)
                .message("Delivery partner assigned successfully")
                .deliveryId(savedDelivery.getId())
                .partnerId(selectedPartner.getId())
                .build();
    }

    /**
     * Legacy method — kept for any remaining Kafka-based assignment paths.
     * Throws RuntimeException if no partner available (old behaviour preserved).
     */
    public void assignDelivery(OrderCreatedEvent event) {

        List<DeliveryPartner> availablePartners =
                partnerRepository.findByStatus(PartnerStatus.AVAILABLE);

        DeliveryPartner selectedPartner =
                assignmentStrategy.assign(availablePartners, event);

        Delivery delivery = Delivery.builder()
                .orderId(event.getOrderId())
                .partner(selectedPartner)
                .status(DeliveryStatus.ASSIGNED)
                .assignedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        deliveryRepository.save(delivery);

        selectedPartner.setStatus(PartnerStatus.BUSY);
        partnerRepository.save(selectedPartner);
    }

    public void assignDeliveryFromPayment(PaymentCompletedEvent paymentEvent) {
        // Map PaymentCompletedEvent to OrderCreatedEvent for strategy compatibility
        OrderCreatedEvent orderEvent = new OrderCreatedEvent();
        orderEvent.setOrderId(paymentEvent.getOrderId());
        orderEvent.setUserId(paymentEvent.getUserId());
        orderEvent.setUserEmail(paymentEvent.getUserEmail());
        orderEvent.setTotalAmount(paymentEvent.getAmount());
        orderEvent.setItems(paymentEvent.getItems());
        
        // Handle delivery slot mapping if needed (paymentEvent has it as String)
        // For now, we'll just proceed with basic assignment
        
        assignDelivery(orderEvent);
    }

    private DeliveryResponse mapToResponse(Delivery delivery) {
        return DeliveryResponse.builder()
                .orderId(delivery.getOrderId())
                .partnerId(delivery.getPartner().getId())
                .partnerName(delivery.getPartner().getName())
                .status(delivery.getStatus())
                .assignedAt(delivery.getAssignedAt())
                .build();
    }

    public List<DeliveryResponse> getAllDeliveries() {
        return deliveryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public DeliveryResponse getDeliveryByOrderId(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        return mapToResponse(delivery);
    }

    public DeliveryResponse updateDeliveryStatus(Long deliveryId, DeliveryStatus status) {

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        delivery.setStatus(status);
        delivery.setUpdatedAt(LocalDateTime.now());

        if (status == DeliveryStatus.DELIVERED) {
            DeliveryPartner partner = delivery.getPartner();
            partner.setStatus(PartnerStatus.AVAILABLE);
            partnerRepository.save(partner);
        }

        Delivery updatedDelivery = deliveryRepository.save(delivery);
        return mapToResponse(updatedDelivery);
    }
}
