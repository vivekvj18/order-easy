<div align="center">

# 🛒 OrderEasy
### Production-Grade Quick Commerce Platform

**A distributed microservices-based Quick Commerce platform built for hyper-local instant delivery**

[![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.5-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-Event_Driven-231F20?style=for-the-badge&logo=apachekafka)](https://kafka.apache.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

---

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Design Decisions](#-design-decisions)

</div>

---

## 📖 Overview

**OrderEasy** is a production-grade, event-driven **Quick Commerce (Q-Commerce)** platform built on a distributed microservices architecture. It covers the complete operational backend of hyper-local instant delivery — from customer checkout to real-time GPS delivery tracking — solving the hardest engineering challenges in the Q-Commerce domain.

### The Problem It Solves

Quick commerce platforms promise delivery within 10 minutes. Achieving this under load requires solving:

| Challenge | Solution in OrderEasy |
|---|---|
| Concurrent stock overselling (flash sales) | Optimistic Locking with `@Version` on Stock entity |
| Service failure propagation | Resilience4j Circuit Breaker with fallback methods |
| Order-to-rider assignment latency | Haversine formula — nearest partner strategy |
| Distributed state consistency | Event-driven Kafka architecture with isolated DBs |
| Real-time GPS tracking overhead | Polling-based Leaflet map with 3s refresh |
| Duplicate payment processing | Idempotency check on `orderId` in PaymentService |

---

## ✨ Features

### 👤 Customer
- Register / Login with **Email + Password** or **Phone OTP** (Twilio Verify)
- Browse product catalog and manage shopping cart
- Place orders with delivery slot selection (`SLOT_10_MIN`)
- Real-time delivery tracking on **interactive Leaflet map**
- View order history, order details, and cancel orders

### 🛵 Delivery Partner
- View assigned deliveries and update delivery status
- Toggle availability (`AVAILABLE` / `BUSY`)
- Live GPS location sharing via **browser Geolocation API**
- Simulation mode with **mathematical drift algorithm** for testing

### 🔧 Admin
- **Analytics Dashboard** with real-time KPIs, charts, and trends
  - 7-day order growth area chart
  - Order status donut chart (Recharts)
  - Inventory stock level bar chart with danger zone
  - Fleet availability donut chart
- Manage all orders with status update capability
- Real-time inventory stock audit with health score
- Rider operations control center with live fleet grid
- View all payments and transaction logs

---

## 🏗 Architecture

### System Architecture Diagram

```
                        ┌─────────────────────────┐
                        │    React Frontend        │
                        │    (Vite, Port 5173)     │
                        └───────────┬─────────────┘
                                    │ HTTP
                        ┌───────────▼─────────────┐
                        │      API Gateway         │
                        │  (Spring Cloud, 8084)    │
                        │  JWT Filter + Routing    │
                        └───────────┬─────────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
   ┌──────────▼──────┐  ┌──────────▼──────┐  ┌───────────▼─────┐
   │  Auth Service   │  │  Order Service  │  │  Cart Service   │
   │   (Port 8081)   │  │   (Port 8083)   │  │   (Port 8085)   │
   │  ordereasy_     │  │  ordereasy_     │  │  ordereasy_     │
   │  auth_db        │  │  order_db       │  │  cart_db        │
   └─────────────────┘  └────────┬────────┘  └─────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Inventory Service     │  ← Feign (sync)
                    │    (Port 8086)          │
                    │   ordereasy_inventory_db│
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Apache Kafka        │
                    │   (Event Bus / Topics)   │
                    └────┬──────┬──────┬───────┘
                         │      │      │
          ┌──────────────┘  ┌───┘  └───────────────┐
          │                 │                       │
┌─────────▼──────┐ ┌────────▼───────┐  ┌───────────▼──────┐
│ Payment Service│ │Delivery Service│  │Notification Svc  │
│  (Port 8090)   │ │  (Port 8087)   │  │   (Port 8089)    │
│  _payment_db   │ │  _delivery_db  │  │ _notification_db │
└────────────────┘ └────────┬───────┘  └──────────────────┘
                            │
                  ┌─────────▼──────┐
                  │Tracking Service│
                  │  (Port 8088)   │
                  │  _tracking_db  │
                  └────────────────┘

        All services register with:
        ┌─────────────────────────┐
        │   Discovery Server      │
        │  (Eureka, Port 8761)    │
        └─────────────────────────┘
```

### Communication Pattern

```
SYNCHRONOUS (OpenFeign) — Critical Path:
Order Service ──► Inventory Service  (stock reservation)
Order Service ──► Delivery Service   (partner assignment)
Cart Service  ──► Product Service    (item validation)

ASYNCHRONOUS (Apache Kafka) — Non-Critical Path:
Order Service ──► [order-created]      ──► Payment Service, Tracking Service, Notification Service
Payment Svc   ──► [payment-completed]  ──► Delivery Service  (rider assigned AFTER payment succeeds)
Order Service ──► [order-cancelled]    ──► Inventory, Notification
Order Service ──► [order-status-updated] ► Notification
```

### Kafka Event Lifecycle

```
Customer Places Order
        ↓
[order-created] ─────────────────────────────────────────────────────┐
        │                                                            │
        ▼                                                            ▼
Payment Service                                           Tracking / Notification
(processPayment)                                         (consume order-created)
        │
        ▼
[payment-completed] ─────────────────────────────────────────────────┐
        │                                                            │
        ▼                                                            ▼
Delivery Service                                              (status: SUCCESS only)
(NearestPartnerStrategy)                               Partner BUSY, Haversine used
(Haversine Formula)
        │
        ▼
  Partner BUSY
        │
Partner delivers → [order-status-updated: DELIVERED]
        │
        ▼
Partner → AVAILABLE
Notification sent to Customer
```

---

## 💻 Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Core language (Virtual Threads) |
| Spring Boot | 4.0.5 | Microservice framework |
| Spring Cloud | 2025.1.1 | Service discovery + API Gateway |
| Spring Cloud OpenFeign | - | Synchronous inter-service communication |
| Spring Data JPA / Hibernate | 6.x | ORM and database operations |
| Resilience4j | 2.x | Circuit Breaker + fault tolerance |
| Apache Kafka | (Confluent 7.4.0) | Event streaming / async messaging |
| Netflix Eureka | - | Service discovery and registration |
| JWT (jjwt) | 0.11.5 | Stateless authentication tokens |
| Twilio Verify SDK | 10.1.0 | SMS OTP authentication |
| Project Lombok | - | Boilerplate reduction |
| MySQL | 8.x | Relational data persistence |
| Maven | 3.x | Build automation |
| Docker & Docker Compose | - | Kafka infrastructure containerization |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.4 | UI framework |
| Vite | 8.0.4 | Build tool + Dev server |
| React Router DOM | 7.14.0 | Client-side routing |
| Axios | 1.15.0 | HTTP client with interceptors |
| Leaflet.js | 1.9.4 | Interactive map engine |
| React Leaflet | 5.0.0 | React bindings for Leaflet |
| Recharts | 3.8.1 | Data visualization charts |
| Tailwind CSS | 3.4.19 | Utility-first CSS styling |
| Lucide React | 1.8.0 | Icon library |
| React Hot Toast | 2.6.0 | Toast notifications |

---

## 🗂 Microservices Reference

| Service | Port | Database | Responsibility |
|---|---|---|---|
| Discovery Server | 8761 | — | Eureka service registry |
| API Gateway | 8084 | — | Routing, JWT filter, CORS |
| Auth Service | 8081 | ordereasy_auth_db | Registration, Login, OTP, JWT |
| Product Service | 8082 | ordereasy_product_db | Product catalog CRUD |
| Cart Service | 8085 | ordereasy_cart_db | Shopping cart management |
| Inventory Service | 8086 | ordereasy_inventory_db | Stock control, reservations |
| Order Service | 8083 | ordereasy_order_db | Order orchestration, Kafka events |
| Payment Service | 8090 | ordereasy_payment_db | Transaction processing |
| Delivery Service | 8087 | ordereasy_delivery_db | Partner assignment, lifecycle |
| Tracking Service | 8088 | ordereasy_tracking_db | GPS coordinate logging |
| Notification Service | 8089 | ordereasy_notification_db | Async alerts and messages |

---

## 🔑 Design Decisions

### 1. Feign vs Kafka — The Critical Decision

The most important architectural decision in OrderEasy is the **hybrid communication model**.

**Why Feign for Inventory + Delivery?**
In Q-Commerce, placing an order requires *immediate* validation:
- Is the stock actually available? → Must check synchronously
- Is there a delivery partner available? → Must confirm before saving the order

Using Kafka here would mean publishing an event, saving the order as `CONFIRMED`, and *then* discovering stock is empty — giving the customer a **false confirmation**. This is a correctness requirement, not a performance choice.

**Why Kafka for Payment, Notification, Tracking?**
Once stock is reserved and the order is saved, downstream actions do not need to block the customer's checkout thread. Publishing to Kafka allows instant `201 Created` response while payment processing, rider assignment, and notifications happen asynchronously in parallel.

### 2. Optimistic Locking — Race Condition Prevention

```java
@Entity
public class Stock {
    @Version
    private Long version; // JPA adds WHERE version=? on every UPDATE
}
```

Two users order the last item simultaneously:
- Both read `{ quantity: 1, version: 5 }`
- User A writes → version becomes 6 ✅
- User B writes → `WHERE version=5` fails → `OptimisticLockException` → 409 Conflict ✅
- Stock never goes negative. No row locking. Zero throughput penalty.

### 3. Haversine Formula — Nearest Partner Selection

```java
// HaversineUtil.java — delivery-service
public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a = Math.sin(dLat/2) * Math.sin(dLat/2)
             + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
             * Math.sin(dLon/2) * Math.sin(dLon/2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

Earth is a sphere — Pythagoras doesn't work for GPS coordinates. Haversine calculates the true great-circle distance, the same algorithm used by Blinkit and Zepto for rider assignment.

**Strategy Pattern implementation:**
```
DeliveryAssignmentStrategy (interface)
    ├── NearestPartnerStrategy (@Primary) → uses Haversine
    └── FirstAvailableStrategy            → fallback when no GPS data
```
`DeliveryService` was never modified — **Open/Closed Principle in practice**.

### 4. Two-Phase Atomic Stock Reservation

```
POST /stock/reserve-bulk
@Transactional

Phase 1 — VALIDATE ALL:
  For each item: if (quantity - reserved < requested) → throw InsufficientStockException
  → If ANY item fails, entire transaction rolls back

Phase 2 — DEDUCT ALL:
  For each item: reservedQuantity += requested
  → Only runs if Phase 1 fully passed
```

This prevents partial reservations where some items deduct but others fail.

### 5. Idempotent Payment Processing

```java
// PaymentService.java
if (paymentRepository.findByOrderId(event.getOrderId()).isPresent()) {
    return; // Already processed — skip silently
}
```

Kafka can redeliver messages. Without this check, a network retry could charge a customer twice. The `orderId` acts as an idempotency key — the same pattern used by Stripe.

### 6. Circuit Breaker Configuration

```yaml
# Resilience4j in order-service
slidingWindowSize: 10
failureRateThreshold: 50%       # Trip if 50% of last 10 calls fail
waitDurationInOpenState: 10s    # Wait 10s before retrying
permittedNumberOfCallsInHalfOpenState: 3
```

If Inventory Service goes down, the Circuit Breaker trips after 5 failures, returns an immediate fallback response, and prevents thread starvation — exactly the Netflix Circuit Breaker pattern.

---

## 🚀 Getting Started

### Prerequisites

- Java 21+
- MySQL 8.x running on port 3306
- Docker & Docker Compose
- Node.js 18+ with npm

### 1. Clone the Repository

```bash
git clone https://github.com/vivekvj18/ordereasy.git
cd ordereasy
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
JWT_SECRET=mysecretkeymysecretkeymysecretkeymysecretkeymysecretkey
DB_USERNAME=spring_user
DB_PASSWORD=Spring@2024
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_sid
```

### 3. Database Setup

Create these databases in MySQL:

```sql
CREATE DATABASE ordereasy_auth_db;
CREATE DATABASE ordereasy_order_db;
CREATE DATABASE ordereasy_inventory_db;
CREATE DATABASE ordereasy_delivery_db;
CREATE DATABASE ordereasy_tracking_db;
CREATE DATABASE ordereasy_notification_db;
CREATE DATABASE ordereasy_cart_db;
CREATE DATABASE ordereasy_payment_db;
```

### 4. Start Everything

```bash
# One command to start all services
./start-all.sh
```

This script:
1. Loads environment variables from `.env`
2. Starts Kafka + Zookeeper via Docker Compose
3. Starts Eureka Discovery Server
4. Starts all 9 microservices with proper sequencing
5. Waits for each service to register before proceeding

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 6. Verify All Services

```bash
./status-check.sh
```

Expected output:
```
✅ Eureka Server (port 8761) — RUNNING
✅ Auth Service (port 8081)  — RUNNING
✅ Order Service (port 8083) — RUNNING
✅ API Gateway (port 8084)   — RUNNING
✅ Inventory Service (8086)  — RUNNING
✅ Delivery Service (8087)   — RUNNING
... (all green)
```

### 7. Access the Application

| Interface | URL | Credentials |
|---|---|---|
| Customer App | http://localhost:5173 | Register a new account |
| Admin Dashboard | http://localhost:5173 | admin@ordereasy.com / Admin@123 |
| Delivery Partner | http://localhost:5173 | Register with role DELIVERY_PARTNER |
| Eureka Dashboard | http://localhost:8761 | — |

---

## 📡 API Reference

### Authentication (`/auth`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/signup` | Register new user | Public |
| POST | `/auth/login` | Login with email + password | Public |
| POST | `/auth/send-otp` | Send OTP to phone | Public |
| POST | `/auth/verify-otp` | Verify OTP, get JWT | Public |
| GET | `/admin/users/summary` | User KPI counts | ADMIN |

### Orders (`/orders`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/orders` | Place new order | CUSTOMER |
| GET | `/orders/{id}` | Get order by ID | CUSTOMER, ADMIN |
| GET | `/orders/all` | Get all orders | ADMIN |
| GET | `/orders` | Paginated + filtered orders | CUSTOMER, ADMIN |
| PUT | `/orders/{id}/status` | Update order status | ADMIN, DELIVERY_PARTNER |
| PUT | `/orders/{id}/cancel` | Cancel order | CUSTOMER, ADMIN |
| GET | `/orders/analytics/summary` | Order KPIs | ADMIN |
| GET | `/orders/analytics/status-breakdown` | Status counts | ADMIN |

### Inventory (`/stock`, `/inventory`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/stock/{productId}` | Get stock level | ADMIN |
| PUT | `/stock/{productId}/add` | Add stock | ADMIN |
| POST | `/stock/reserve-bulk` | Atomic stock reservation | Internal (Feign) |
| GET | `/inventory/analytics/stock-summary` | All stock with low-stock flags | ADMIN |

### Delivery (`/deliveries`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/deliveries` | All deliveries | ADMIN |
| GET | `/deliveries/{orderId}` | Get delivery by order | CUSTOMER, ADMIN |
| PATCH | `/deliveries/{id}/status` | Update delivery status | DELIVERY_PARTNER |
| POST | `/deliveries/assign` | Manual partner assignment | Internal (Feign) |
| GET | `/deliveries/analytics/partner-summary` | Fleet KPIs | ADMIN |

### Tracking (`/tracking`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/tracking/update` | Post GPS coordinates | DELIVERY_PARTNER |
| GET | `/tracking/{orderId}` | Latest rider location | CUSTOMER |
| GET | `/tracking/{orderId}/history` | Full route history | CUSTOMER |

### Payments (`/payments`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/payments/all` | All transactions | ADMIN |
| GET | `/payments/order/{orderId}` | Payment by order | CUSTOMER, ADMIN |
| GET | `/payments/user/{userId}` | User payment history | CUSTOMER |
| POST | `/payments/pay/{orderId}` | Manual Pay Now trigger | CUSTOMER |
| GET | `/payments/analytics/summary` | Payment KPIs | ADMIN |

---

## 🗄 Database Schema

### Stock Table (with Optimistic Locking)

```sql
CREATE TABLE stock (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id         BIGINT NOT NULL,
    quantity           INT,              -- Physical stock in warehouse
    reserved_quantity  INT,              -- Locked during order processing
    updated_at         DATETIME,
    version            BIGINT DEFAULT 0  -- @Version field for Optimistic Lock
);
```

### Orders Table (with Delivery Coordinates)

```sql
CREATE TABLE orders (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    user_email          VARCHAR(255),
    total_amount        DOUBLE,
    status              VARCHAR(20),
    delivery_slot       VARCHAR(30),
    delivery_latitude   DOUBLE,           -- Customer GPS for Haversine
    delivery_longitude  DOUBLE,
    created_at          DATETIME
);
```

### Delivery Partners Table (with GPS)

```sql
CREATE TABLE delivery_partners (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255),
    phone       VARCHAR(50),
    status      VARCHAR(20),    -- AVAILABLE / BUSY
    latitude    DOUBLE,         -- Partner GPS for Haversine
    longitude   DOUBLE,
    created_at  DATETIME
);
```

---

## 🎨 Frontend Pages

| Role | Pages | Count |
|---|---|---|
| Public | Login, Register | 2 |
| Customer | Home, Product Detail, Cart, Place Order, My Orders, Order Detail, Track Order | 7 |
| Delivery Partner | Partner Dashboard, My Deliveries, Availability, Update Location | 4 |
| Admin | Dashboard Analytics, All Orders, Inventory, Delivery Partners | 4 |
| **Total** | | **17** |

---

## 🧩 Design Patterns

| Pattern | Implementation | Location |
|---|---|---|
| **Strategy** | `DeliveryAssignmentStrategy` interface with `NearestPartnerStrategy` and `FirstAvailableStrategy` | `delivery-service/strategy/` |
| **Proxy** | `ExternalServiceProxy` wraps Feign clients with Circuit Breaker | `order-service/service/` |
| **Repository** | Spring Data JPA interfaces for all DB operations | All services |
| **Builder** | Lombok `@Builder` on all entities and events | All services |
| **Observer** | Kafka producer-consumer chain for order lifecycle events | Kafka topics |

---

## 🔒 Security

- **Stateless JWT Authentication** — No server-side sessions, horizontally scalable
- **Role-Based Access Control** — `CUSTOMER`, `ADMIN`, `DELIVERY_PARTNER` enforced at API Gateway
- **Gateway-Level JWT Validation** — Single enforcement point before routing to any service
- **CORS Configuration** — Allows frontend on localhost:5173 only
- **Environment Variables** — JWT secret and DB credentials in `.env`, never committed to Git
- **BCrypt Password Hashing** — Standard strength-10 bcrypt for all passwords
- **OTP Authentication** — Twilio Verify API for phone-based authentication

---

## 📊 Admin Dashboard Features

| Section | Chart Type | Data Source |
|---|---|---|
| Order KPIs | Stat cards with sparklines | `GET /orders/analytics/summary` |
| 7-Day Order Trend | Area chart (Recharts) | `GET /orders/all` (grouped by date) |
| Order Status | Donut chart (Recharts PieChart) | `GET /orders/analytics/status-breakdown` |
| Inventory Levels | Horizontal bar chart with danger zone | `GET /inventory/analytics/stock-summary` |
| Fleet Availability | Donut chart + fleet grid cards | `GET /deliveries/analytics/partner-summary` |
| Payment Summary | Stat cards | `GET /payments/analytics/summary` |
| Recent Orders | Filterable table with status badges | `GET /orders/all` |

All data auto-refreshes every 30 seconds. Manual sync available via "Force Sync" button.

---

## 📁 Project Structure

```
ordereasy/
├── backend/
│   ├── discovery-server/          # Eureka registry
│   ├── api-gateway/               # Spring Cloud Gateway + JWT filter
│   ├── auth-service/              # Auth, JWT, Twilio OTP
│   ├── product-service/           # Product catalog
│   ├── cart-service/              # Shopping cart
│   ├── inventory-service/         # Stock management + Optimistic Lock
│   ├── order-service/             # Order orchestration + Kafka producer
│   ├── payment-service/           # Payment processing + idempotency
│   ├── delivery-service/          # Partner assignment + Haversine
│   ├── tracking-service/          # GPS coordinate logging
│   └── notification-service/      # Async notifications
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios instances + API functions
│   │   ├── components/            # Reusable UI components
│   │   ├── context/               # AuthContext, CartContext
│   │   ├── pages/
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── customer/          # 7 customer pages
│   │   │   ├── delivery/          # 4 rider pages
│   │   │   └── admin/             # 4 admin pages
│   │   ├── routes/                # Route guards per role
│   │   └── utils/                 # Formatters, constants
│   └── package.json
├── infrastructure/
│   └── kafka/
│       └── docker-compose.yml     # Kafka + Zookeeper
├── docs/
│   └── DECISIONS.md               # Detailed architectural decisions
├── .env.example                   # Template for environment variables
├── start-all.sh                   # One-command startup script
├── stop-all.sh                    # Graceful shutdown script
└── status-check.sh                # Health check for all services
```

---

## 🤝 Author

**Vivek Joshi**
MTech Computer Science — IIIT Bangalore

[![LinkedIn](https://img.shields.io/badge/LinkedIn-vivekjoshi18-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/vivekjoshi18/)
[![GitHub](https://img.shields.io/badge/GitHub-vivekvj18-181717?style=for-the-badge&logo=github)](https://github.com/vivekvj18)

---

<div align="center">

**OrderEasy** — A production-grade Quick Commerce backend built with real engineering decisions.

*Every design decision in this project reflects a real production challenge in Q-Commerce systems.*

</div>
