package com.ordereasy.order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderAnalyticsSummaryResponse {
    private long totalOrders;
    private long confirmedOrders;
    private long deliveredOrders;
    private long cancelledOrders;
    private Double totalRevenue;
    private long todayOrders;
    private Double todayRevenue;
}
