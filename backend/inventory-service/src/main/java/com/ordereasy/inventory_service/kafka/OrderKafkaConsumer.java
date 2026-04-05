package com.ordereasy.inventory_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.event.OrderCreatedEvent;
import com.ordereasy.inventory_service.service.StockService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderKafkaConsumer {

    private final StockService stockService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderKafkaConsumer(StockService stockService) {
        this.stockService = stockService;
    }

    @KafkaListener(topics = "order-created", groupId = "inventory-group")
    public void handleOrderCreated(String message) {
        try {
            OrderCreatedEvent event = objectMapper.readValue(message, OrderCreatedEvent.class);

            System.out.println("Received event: " + event.getOrderId());

            ReserveStockRequest request = new ReserveStockRequest();
            request.setProductId(event.getProductId());
            request.setQuantity(event.getQuantity());

            stockService.reserveStock(request);

        } catch (Exception e) {
            System.err.println("Failed to process event: " + e.getMessage());
        }
    }
}