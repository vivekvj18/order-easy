package com.ordereasy.inventory_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordereasy.inventory_service.dto.ReserveStockRequest;
import com.ordereasy.inventory_service.event.OrderCancelledEvent;
import com.ordereasy.inventory_service.service.StockService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for inventory-related events.
 *
 * NOTE: The order-created stock reservation has been removed because
 * Order Service now calls Inventory Service synchronously via OpenFeign
 * before saving the order. Stock is reserved at that point.
 *
 * The order-cancelled listener is retained to release reserved stock
 * when a customer cancels an order.
 */
@Component
public class OrderKafkaConsumer {

    private final StockService stockService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderKafkaConsumer(StockService stockService) {
        this.stockService = stockService;
    }

    @KafkaListener(topics = "order-cancelled", groupId = "inventory-group")
    public void handleOrderCancelled(String message) {
        try {
            OrderCancelledEvent event = objectMapper.readValue(message, OrderCancelledEvent.class);
            System.out.println("Order cancelled event received: " + event.getOrderId());

            event.getItems().forEach(item -> {
                ReserveStockRequest request = new ReserveStockRequest();
                request.setProductId(item.getProductId());
                request.setQuantity(item.getQuantity());
                stockService.releaseStock(request);
            });

        } catch (Exception e) {
            System.err.println("Failed to process order-cancelled event: " + e.getMessage());
        }
    }
}