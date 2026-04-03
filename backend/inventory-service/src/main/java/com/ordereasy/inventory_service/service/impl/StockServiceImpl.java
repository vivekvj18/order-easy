package com.ordereasy.inventory_service.service.impl;

import com.ordereasy.inventory_service.dto.AddStockRequest;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.dto.StockResponse;
import com.ordereasy.inventory_service.entity.Stock;
import com.ordereasy.inventory_service.exception.InsufficientStockException;
import com.ordereasy.inventory_service.exception.StockNotFoundException;
import com.ordereasy.inventory_service.repository.StockRepository;
import com.ordereasy.inventory_service.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;

    @Override
    public StockResponse getStock(Long productId) {
        Stock stock = stockRepository.findByProductId(productId)
                .orElseThrow(() -> new StockNotFoundException("Stock not found for product id: " + productId));
        return mapToResponse(stock);
    }

    @Override
    public StockResponse addStock(Long productId, AddStockRequest request) {
        Stock stock = stockRepository.findByProductId(productId)
                .orElse(Stock.builder()
                        .productId(productId)
                        .quantity(0)
                        .reservedQuantity(0)
                        .build());

        stock.setQuantity(stock.getQuantity() + request.getQuantity());
        stock.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(stockRepository.save(stock));
    }

    @Override
    public StockResponse reserveStock(ReserveStockRequest request) {
        Stock stock = stockRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new StockNotFoundException("Stock not found for product id: " + request.getProductId()));

        int available = stock.getQuantity() - stock.getReservedQuantity();

        if (available < request.getQuantity()) {
            throw new InsufficientStockException("Insufficient stock. Available: " + available);
        }

        stock.setReservedQuantity(stock.getReservedQuantity() + request.getQuantity());
        stock.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(stockRepository.save(stock));
    }

    @Override
    public StockResponse releaseStock(ReserveStockRequest request) {
        Stock stock = stockRepository.findByProductId(request.getProductId())
                .orElseThrow(() -> new StockNotFoundException("Stock not found for product id: " + request.getProductId()));

        if (stock.getReservedQuantity() < request.getQuantity()) {
            throw new InsufficientStockException("Cannot release more than reserved quantity");
        }

        stock.setReservedQuantity(stock.getReservedQuantity() - request.getQuantity());
        stock.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(stockRepository.save(stock));
    }

    private StockResponse mapToResponse(Stock stock) {
        int available = stock.getQuantity() - stock.getReservedQuantity();
        return StockResponse.builder()
                .productId(stock.getProductId())
                .quantity(stock.getQuantity())
                .reservedQuantity(stock.getReservedQuantity())
                .availableQuantity(available)
                .build();
    }
}