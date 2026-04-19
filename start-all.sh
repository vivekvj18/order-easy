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
  "inventory-service"
  "order-service"
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
echo "  Auth Service      → http://localhost:8081"
echo "  Order Service     → http://localhost:8083"
echo "  API Gateway       → http://localhost:8084"
echo "  Inventory Service → http://localhost:8086"
echo "  Delivery Service  → http://localhost:8087"
echo "  Tracking Service  → http://localhost:8088"
echo "  Notification      → http://localhost:8089"
echo ""
echo "Logs: /tmp/<service-name>.log"
