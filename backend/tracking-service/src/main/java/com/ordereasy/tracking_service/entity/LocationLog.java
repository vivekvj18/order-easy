package com.ordereasy.tracking_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "location_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    private Long partnerId;

    private Double latitude;

    private Double longitude;

    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    private Status status;
}