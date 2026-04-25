package com.ordereasy.inventory_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private Integer quantity;

    private Integer reservedQuantity;

    private LocalDateTime updatedAt;

    @Version                    // ← ADD THIS ANNOTATION
    private Long version;       // ← ADD THIS FIELD
}