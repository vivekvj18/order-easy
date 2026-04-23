#!/bin/bash
echo "🛑 Stopping all services..."

pkill -f "spring-boot:run"
pkill -f "OrderServiceApplication"
pkill -f "InventoryServiceApplication"
pkill -f "DeliveryServiceApplication"
pkill -f "TrackingServiceApplication"
pkill -f "NotificationServiceApplication"
pkill -f "AuthServiceApplication"
pkill -f "ApiGatewayApplication"
pkill -f "ProductServiceApplication"
pkill -f "CartServiceApplication"
pkill -f "PaymentServiceApplication"
pkill -f "DiscoveryServerApplication"

cd infrastructure/kafka
docker-compose down

echo "✅ All services stopped!"
