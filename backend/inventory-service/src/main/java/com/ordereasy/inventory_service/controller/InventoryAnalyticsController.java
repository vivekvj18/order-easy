package com.ordereasy.inventory_service.controller;

import com.ordereasy.inventory_service.dto.StockSummaryResponse;
import com.ordereasy.inventory_service.entity.Stock;
import com.ordereasy.inventory_service.repository.StockRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/inventory/analytics")
public class InventoryAnalyticsController {

    private final StockRepository stockRepository;

    public InventoryAnalyticsController(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @GetMapping("/stock-summary")
    public List<StockSummaryResponse> getStockSummary() {
        log.info("Received request for inventory stock summary");
        List<Stock> stocks = stockRepository.findAll();
        
        return stocks.stream()
                .map(stock -> {
                    int quantity = stock.getQuantity() != null ? stock.getQuantity() : 0;
                    int reserved = stock.getReservedQuantity() != null ? stock.getReservedQuantity() : 0;
                    int available = quantity - reserved;
                    boolean lowStock = available < 10;

                    return StockSummaryResponse.builder()
                            .productId(stock.getProductId())
                            .quantity(quantity)
                            .reservedQuantity(reserved)
                            .availableQuantity(available)
                            .lowStock(lowStock)
                            .build();
                })
                .collect(Collectors.toList());
    }
}
