package com.ordereasy.delivery_service.service;

import com.ordereasy.delivery_service.dto.DeliveryResponse;
import com.ordereasy.delivery_service.entity.Delivery;
import com.ordereasy.delivery_service.entity.DeliveryPartner;
import com.ordereasy.delivery_service.entity.DeliveryStatus;
import com.ordereasy.delivery_service.entity.PartnerStatus;
import com.ordereasy.delivery_service.event.OrderCreatedEvent;
import com.ordereasy.delivery_service.repository.DeliveryPartnerRepository;
import com.ordereasy.delivery_service.repository.DeliveryRepository;
import com.ordereasy.delivery_service.strategy.DeliveryAssignmentStrategy;
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
