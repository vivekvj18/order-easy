#!/bin/bash

echo "🚀 Starting OrderEasy..."

# Step 1 — Kafka
echo "Starting Kafka..."
cd infrastructure/kafka
docker-compose up -d
cd ../..

sleep 5

# Step 2 — Services
SERVICES=(
  "auth-service"
  "api-gateway"
  "product-service"
  "cart-service"
  "inventory-service"
  "order-service"
  "payment-service"
  "delivery-service"
  "tracking-service"
  "notification-service"
)

BASE="/home/vivekjoshi/Desktop/MTECH CSE 2025/SEMESTER-2/ORDER_EASY_PROJECT/backend"

for SERVICE in "${SERVICES[@]}"; do
  echo "Starting $SERVICE..."
  cd "$BASE/$SERVICE"
  ./mvnw spring-boot:run > /tmp/$SERVICE.log 2>&1 &
  echo "$SERVICE started (PID: $!)"
  sleep 3
done

echo ""
echo "✅ All services started!"
echo ""
echo "Ports:"
echo "  Auth Service      → http://localhost:8081
  Product Service   → http://localhost:8082
  Order Service     → http://localhost:8083
  API Gateway       → http://localhost:8084
  Cart Service      → http://localhost:8085
  Inventory Service → http://localhost:8086
  Delivery Service  → http://localhost:8087
  Tracking Service  → http://localhost:8088
  Notification      → http://localhost:8089
  Payment Service   → http://localhost:8090
"
echo ""
echo "Logs: /tmp/<service-name>.log"
