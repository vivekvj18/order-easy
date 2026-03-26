package com.ordereasy.order_service.dto;

import java.util.List;

public class PaginatedOrderResponse {

    private List<OrderResponse> orders;
    private int currentPage;
    private int totalPages;
    private long totalItems;

    public PaginatedOrderResponse(List<OrderResponse> orders,
                                  int currentPage,
                                  int totalPages,
                                  long totalItems) {
        this.orders = orders;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalItems = totalItems;
    }

    public List<OrderResponse> getOrders() {
        return orders;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public long getTotalItems() {
        return totalItems;
    }

    // getters
}
