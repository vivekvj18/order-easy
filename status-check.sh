#!/bin/bash

echo "📊 OrderEasy Service Status"
echo "================================"

check_service() {
  local NAME=$1
  local PORT=$2
  
  if curl -s --max-time 2 "http://localhost:$PORT/actuator/health" > /dev/null 2>&1; then
    echo "✅ $NAME (port $PORT) — RUNNING"
  elif curl -s --max-time 2 "http://localhost:$PORT" > /dev/null 2>&1; then
    echo "✅ $NAME (port $PORT) — RUNNING"
  else
    echo "❌ $NAME (port $PORT) — DOWN"
  fi
}

echo "Infrastructure:"
check_service "Eureka Server"    8761

echo ""
echo "Services:"
check_service "Auth Service"      8081
check_service "Product Service"   8082
check_service "Order Service"     8083
check_service "API Gateway"       8084
check_service "Cart Service"      8085
check_service "Inventory Service" 8086
check_service "Delivery Service"  8087
check_service "Tracking Service"  8088
check_service "Notification"      8089
check_service "Payment Service"   8090

echo ""
echo "External:"
if docker ps | grep -q kafka; then
  echo "✅ Kafka — RUNNING"
else
  echo "❌ Kafka — DOWN"
fi
