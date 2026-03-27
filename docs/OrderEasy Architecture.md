# 🏗️ OrderEasy — Architecture

## 📌 Overview

OrderEasy is a microservices-ready backend system designed to handle:

- Order processing
- Authentication
- Inventory management
- Delivery system (future)

---

## 🧠 Current Architecture (Phase B1)

Currently implemented as:

Modular Monolith (Single Service → Order Service)

---

## 🧩 Layers

### 1. Controller Layer
- Handles HTTP requests
- Example:
  - POST /orders
  - GET /orders
  - GET /orders/{id}

---

### 2. Service Layer
- Contains business logic
- Handles filtering, pagination, sorting

---

### 3. Repository Layer
- Communicates with database
- Uses Spring Data JPA

---

### 4. Entity Layer
- Represents database tables
- Example:
  - Order
  - OrderStatus

---

### 5. DTO Layer
- Controls API input/output
- Example:
  - CreateOrderRequest
  - OrderResponse
  - PaginatedOrderResponse

---

## 🔄 Flow

Client → Controller → Service → Repository → Database

---

## 🗄️ Database

- MySQL
- Pagination handled at DB level (LIMIT, OFFSET)
- Separate DB per service (planned)

---

## 🚀 Features Implemented

- CRUD APIs
- Validation
- Exception Handling
- Pagination
- Dynamic Sorting
- Filtering (status, userId)
- Range Filtering (amount, date)

---

## 🚀 Future Architecture

- Separate services:
  - Auth Service
  - Inventory Service
- API Gateway
- Service-to-service communication
- Kafka (event-driven)
