# 🏗️ OrderEasy — Architecture

## 📌 Overview

OrderEasy is a microservices-based quick commerce backend system designed to handle:

* Order processing
* Inventory management
* Delivery assignment
* Real-time tracking

---

## 🧠 Current Architecture (Phase B1)

Currently implemented as:

Monolithic Spring Boot Service → Order Service

---

## 🧩 Layers

### 1. Controller Layer

* Handles HTTP requests
* Example:

  * POST /orders
  * GET /orders
  * GET /orders/{id}

---

### 2. Service Layer

* Contains business logic
* Example:

  * createOrder()
  * getAllOrders()
  * getOrderById()

---

### 3. Repository Layer

* Communicates with database
* Uses Spring Data JPA

---

### 4. Entity Layer

* Represents database tables
* Example:

  * Order
  * OrderStatus

---

### 5. DTO Layer

* Controls API input/output
* Example:

  * CreateOrderRequest
  * OrderResponse

---

## 🔄 Flow

Client → Controller → Service → Repository → Database

---

## 🗄️ Database

* MySQL
* Separate DB per service (planned)

---

## 🚀 Future Architecture

* Microservices split:

  * Auth Service
  * Inventory Service
  * Delivery Service
* Kafka for event-driven communication
* API Gateway

