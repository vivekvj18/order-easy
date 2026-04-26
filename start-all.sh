#!/bin/bash
echo "🚀 Starting OrderEasy..."
# Step 1 — Infrastructure (Kafka)
echo "Starting Kafka..."
cd infrastructure/kafka
docker-compose up -d
cd ../..
sleep 5
# Step 2 — Discovery Server (Critical Foundation)
echo "Starting Discovery Server..."
BASE="/home/vivekjoshi/Desktop/MTECH CSE 2025/SEMESTER-2/ORDER_EASY_PROJECT/backend"
cd "$BASE/discovery-server"
./mvnw spring-boot:run > /dev/null 2>&1 &
echo "Discovery Server started (PID: $!)"
echo "Waiting for Discovery Server to initialize..."
sleep 15
# Step 3 — Microservices
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
for SERVICE in "${SERVICES[@]}"; do
  echo "Starting $SERVICE..."
  cd "$BASE/$SERVICE"
  ./mvnw spring-boot:run > /dev/null 2>&1 &
  echo "$SERVICE started (PID: $!)"
  sleep 3
done
echo ""
echo "✅ All services started!"
echo ""
echo "Dashboard:"
echo "  Eureka Server     → http://localhost:8761"
echo ""
echo "Ports:"
echo "  Auth Service      → http://localhost:8081"
echo "  Product Service   → http://localhost:8082"
echo "  Order Service     → http://localhost:8083"
echo "  API Gateway       → http://localhost:8084"
echo "  Cart Service      → http://localhost:8085"
echo "  Inventory Service → http://localhost:8086"
echo "  Delivery Service  → http://localhost:8087"
echo "  Tracking Service  → http://localhost:8088"
echo "  Notification      → http://localhost:8089"
echo "  Payment Service   → http://localhost:8090"
