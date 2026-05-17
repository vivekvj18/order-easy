package com.ordereasy.delivery_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerSummaryResponse {
    private long totalPartners;
    private long available;
    private long busy;
}
