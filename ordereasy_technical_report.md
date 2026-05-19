# OrderEasy — Exhaustive Technical Architecture & Project Report

> **Document Type**: Professional System Design & Implementation Specification  
> **Target Audience**: Technical Interviewers, System Architects, Senior Software Engineers  
> **Project Scope**: Hyper-local E-commerce/Q-commerce Distributed System Simulation  

---

## ═══════════════════════════════════════════
## 1. PROJECT OVERVIEW
## ═══════════════════════════════════════════

### What is OrderEasy?
**OrderEasy** is a production-grade, state-of-the-art **distributed microservices-based Q-Commerce (Quick-Commerce) application** designed with a highly modular, event-driven architecture. It provides hyper-local delivery of groceries and household items within tight time bounds, simulating the core backend and frontend operational workflows of leading quick-delivery platforms.

### What Real-World Platform Does It Simulate?
OrderEasy acts as a direct simulation of high-throughput **Q-Commerce and hyper-local instant delivery platforms** such as **Blinkit, Zepto, Swiggy Instamart, and Dunzo**. It simulates the entire operational cycle:
1. **Customer Checkout**: Quick carting, atomic stock checks, and instant order placement.
2. **Synchronous/Asynchronous Orchestration**: Dual-mode coupling utilizing Feign for instant checks and Kafka for fire-and-forget downstream actions.
3. **Automated Warehouse/Inventory Management**: Real-time stock reservations and automated cancellations/releases.
4. **Geo-Location Based Delivery Matching**: Automated matching of deliveries based on geographical proximity using mathematical algorithms.
5. **Rider Live GPS Tracking**: Live coordinate streaming from rider tracking apps to customer-facing interactive maps.

### What Problem Does It Solve?
Quick commerce platforms operate under extreme service level agreements (SLAs), typically promising delivery within 10 to 15 minutes. To achieve this, the underlying software architecture must solve critical engineering challenges:
* **Race Conditions on Stock**: Preventing overselling when thousands of customers check out hot-selling items simultaneously.
* **Service Autonomy & Failure Propagation**: Ensuring that a failure in a secondary service (e.g., Notifications or Tracking) does not bring down the core checkout funnel (Order Placement/Payment).
* **Rider-to-Order Assignment Latency**: Designing a scalable mechanism to match orders with delivery partners based on current location and workload.
* **Distributed State Consistency**: Keeping the customer order status, the delivery assignment status, and the rider's physical availability synchronized across decoupled datastores without blocking threads.
* **Real-time Geo-tracking overhead**: Handling high-frequency live GPS updates from riders without overwhelming relational databases or locking user threads.

---

## ═══════════════════════════════════════════
## 2. COMPLETE TECH STACK WITH EXACT VERSIONS
## ═══════════════════════════════════════════

### 2.1 Backend Architecture (Spring Boot & Spring Cloud)
* **Core Framework**: `Spring Boot 4.0.5`
  * Leverages Spring Framework 6.x capabilities.
  * Embedded **Apache Tomcat** web server for microservices.
* **Cloud Infrastructure**: `Spring Cloud 2025.1.1`
  * **Service Discovery**: Spring Cloud Netflix Eureka Client/Server.
  * **API Gateway**: Spring Cloud Gateway (Reactive WebFlux-based routing).
  * **Synchronous REST Client**: Spring Cloud OpenFeign.
* **Resilience Framework**: `Resilience4j 2.x` (integrated via `io.github.resilience4j:resilience4j-spring-boot-3` / `openfeign` support).
* **Persistence & ORM**: **Spring Data JPA / Hibernate Core 6.x**
* **Database Driver**: `mysql-connector-j` (Official Oracle MySQL Driver).
* **Security & Tokenization**: `JSON Web Tokens (JWT)` via Java JWT library:
  * `io.jsonwebtoken:jjwt-api:0.11.5`
  * `io.jsonwebtoken:jjwt-impl:0.11.5`
  * `io.jsonwebtoken:jjwt-jackson:0.11.5`
* **Third-Party OTP Integration**: `Twilio SDK 10.1.0` (for phone authentication and OTP verification).
* **Utility Tools**: `Project Lombok` (Annotation-based boilerplate reduction), `Jackson Databind` (JSON parsing).
* **Language Runtime**: `Java 21` (utilizing virtual thread support, modern switch expressions, and record structures).
* **Build Automation**: `Maven 3.x` (wrapped via standard `./mvnw`).

### 2.2 Frontend Architecture (Single Page Application)
* **Core Library**: `React 19.2.4` (utilizing React Server Components and optimized rendering pipelines).
* **DOM Renderer**: `React DOM 19.2.4`
* **Build Tool & Dev Server**: `Vite 8.0.4` (enabling lightning-fast Hot Module Replacement - HMR).
* **Routing**: `React Router DOM 7.14.0`
* **HTTP Client**: `Axios 1.15.0` (with unified Request/Response interceptors).
* **Interactive Mapping Engine**:
  * `Leaflet.js 1.9.4` (Mobile-friendly interactive map engine).
  * `React Leaflet 5.0.0` (React bindings for Leaflet).
* **Data Visualization / Charts**: `Recharts 3.8.1` (Redrawn charts with React SVG elements).
* **UI/UX Styling**: `Tailwind CSS 3.4.19` (Utility-first styling system) & `PostCSS 8.5.9` + `Autoprefixer 10.4.27`.
* **Icons**: `Lucide React 1.8.0`
* **Notifications**: `React Hot Toast 2.6.0`

### 2.3 Middleware & Infrastructure
* **Message Broker / Event Log**: **Apache Kafka** (confluentinc/cp-kafka Dockerized cluster)
* **Relational Database**: **MySQL 8.x** (multi-database isolated architecture).
* **Containerization**: **Docker & Docker Compose** (infrastructure orchestration).

---

## ═══════════════════════════════════════════
## 3. MICROSERVICES — COMPLETE LIST & DEEP-DIVE
## ═══════════════════════════════════════════

OrderEasy is built on **11 decoupled services**: 2 operational foundation servers and 9 functional business microservices.

```
                                 ┌───────────────────┐
                                 │  Discovery Server │
                                 │   (Eureka, 8761)  │
                                 └─────────┬─────────┘
                                           │ (Registration)
                                           ▼
┌──────────────────┐             ┌───────────────────┐
│     CUSTOMER     ├────────────►│    API Gateway    │
│  (React, 5173)   │             │  (WebFlux, 8084)  │
└──────────────────┘             └─────────┬─────────┘
                                           │
       ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
       │ (HTTP REST)       │ (HTTP REST)   │ (HTTP REST)   │ (HTTP REST)       │ (HTTP REST)
       ▼                   ▼               ▼               ▼                   ▼
┌──────────────┐   ┌──────────────┐┌──────────────┐┌──────────────┐    ┌──────────────┐
│ Auth-Service │   │ Cart-Service ││Product-Servic││Order-Service │    │Delivery-Serv.│
│ (Port 8081)  │   │ (Port 8085)  ││ (Port 8082)  ││ (Port 8083)  │    │ (Port 8087)  │
└──────┬───────┘   └──────┬───────┘└──────┬───────┘└──────┬───────┘    └──────┬───────┘
       │                  │               │               │                   │
 ┌─────┴─────┐      ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐       ┌─────┴─────┐
 │  MySQL:   │      │  MySQL:   │   │  MySQL:   │   │  MySQL:   │       │  MySQL:   │
 │ _auth_db  │      │ _cart_db  │   │_product_db│   │ _order_db │       │_delivery_d│
 └───────────┘      └───────────┘   └───────────┘   └─────┬─────┘       └─────┬─────┘
                                                          │                   │
                                                          │ (Produce)         │ (Consume/Prod)
                                                          ▼                   ▼
                                                 ===============================
                                                 ▲           KAFKA             ▲
                                                 ===============================
                                                          ▲                   ▲
                                                          │ (Consume)         │ (Consume)
                                                          ▼                   ▼
                                                    ┌──────────────┐    ┌──────────────┐
                                                    │Payment-Servic│    │Tracking-Serv.│
                                                    │ (Port 8090)  │    │ (Port 8088)  │
                                                    └──────┬───────┘    └──────┬───────┘
                                                           │                   │
                                                     ┌─────┴─────┐       ┌─────┴─────┐
                                                     │  MySQL:   │       │  MySQL:   │
                                                     │_payment_db│       │_tracking_d│
                                                     └───────────┘       └───────────┘
```

### 3.1 Discovery Server (Eureka)
* **Service Name**: `discovery-server`
* **Port**: `8761`
* **Primary Responsibility**: Acts as the central Service Registry. Every microservice registers its IP, port, and health indicators upon startup. Other services query Eureka to dynamically locate downstream instances instead of utilizing hardcoded URLs, enabling elastic auto-scaling.
* **Database**: None.

### 3.2 API Gateway (Spring Cloud Gateway)
* **Service Name**: `api-gateway`
* **Port**: `8084`
* **Primary Responsibility**: Represents the single entrypoint for all clients. Routes incoming requests to target services via Eureka service-discovery aliases (`lb://`). Runs reactive security filters to validate JSON Web Tokens, checks user roles, intercepts CORS preflight requests, and handles exceptions globally.
* **Database**: None.

### 3.3 Auth & User Service
* **Service Name**: `auth-service`
* **Port**: `8081`
* **Database**: `ordereasy_auth_db`
* **Primary Responsibility**: Manages user registration, profiles, and authentication modes. Offers dual login verification: traditional BCrypt password validation and frictionless mobile OTP verification (leveraging Twilio Verify APIs). Issues cryptographic JWTs packed with identity, phone number, and security roles.
* **Key Entities / Tables**: `users` (mapped to `User.java` with columns: `id`, `email`, `password`, `role`, `phone_number`).
* **Key API Endpoints**:
  * `POST /auth/signup` - Registers a new user.
  * `POST /auth/login` - Traditional password-based login returning JWT.
  * `POST /auth/send-otp` - Triggers Twilio OTP to mobile phone.
  * `POST /auth/verify-otp` - Verifies OTP and returns JWT.
  * `GET /admin/users/summary` - Provides KPI aggregations for user types.

### 3.4 Product Catalog Service
* **Service Name**: `product-service`
* **Port**: `8082`
* **Database**: `ordereasy_product_db`
* **Primary Responsibility**: Serves as the read-heavy static product catalog displaying item attributes, pricing, descriptions, and categories.
* **Key Entities / Tables**: `products` (mapped to `Product.java` with columns: `id`, `name`, `category`, `price`, `description`, `created_at`).
* **Key API Endpoints**:
  * `GET /products` - Fetches the full product list.
  * `GET /products/{id}` - Resolves a product by its primary key.
  * `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` - Admin CRUD endpoints.

### 3.5 Shopping Cart Service
* **Service Name**: `cart-service`
* **Port**: `8085`
* **Database**: `ordereasy_cart_db`
* **Primary Responsibility**: Manages active transient shopping carts. Integrates with the Product Service via OpenFeign client proxies to validate item data during additions.
* **Key Entities / Tables**: `cart_items` (mapped to `CartItem.java` with columns: `id`, `user_id`, `product_id`, `quantity`).
* **Key API Endpoints**:
  * `GET /cart/{userId}` - Fetches the active cart for a customer.
  * `POST /cart` - Adds/increments items in the cart.
  * `DELETE /cart/{userId}/{productId}` - Removes a specific item.
  * `DELETE /cart/{userId}` - Clears the active cart upon successful checkout.

### 3.6 Inventory & Stock Service
* **Service Name**: `inventory-service`
* **Port**: `8086`
* **Database**: `ordereasy_inventory_db`
* **Primary Responsibility**: Core stock control and product database. Responsible for keeping track of physical item quantities and managing "reserved" stock states during order processing. High concurrency is handled via Optimistic Locking.
* **Key Entities / Tables**: 
  * `products` - Copy of product registry.
  * `stock` (mapped to `Stock.java` with columns: `id`, `product_id`, `quantity` [physical], `reserved_quantity`, `updated_at`, `version` [Optimistic Lock indicator]).
* **Key API Endpoints**:
  * `GET /stock/{productId}` - Resolves stock level.
  * `PUT /stock/{productId}/add` - Adds physical inventory.
  * `POST /stock/reserve-bulk` - Atomic stock reservation for order checkouts.
  * `GET /inventory/analytics/stock-summary` - Returns stock levels and low-stock warning items.
* **Kafka Topics Consumed**:
  * `order-cancelled` (group ID: `inventory-group`) -> Triggers automated release of reserved items.

### 3.7 Order Orchestrator Service
* **Service Name**: `order-service`
* **Port**: `8083`
* **Database**: `ordereasy_order_db`
* **Primary Responsibility**: Coordinates the business checkout pipeline. Places orders, communicates synchronously with the Cart and Inventory services using Feign clients with Resilience4j circuit breakers, updates state, and publishes Kafka events.
* **Key Entities / Tables**:
  * `orders` (mapped to `Order.java` with columns: `id`, `user_id`, `user_email`, `total_amount`, `status`, `delivery_slot`, `created_at`, `delivery_latitude`, `delivery_longitude`).
  * `order_items` (mapped to `OrderItem.java` with columns: `id`, `order_id`, `product_id`, `quantity`, `price`).
* **Key API Endpoints**:
  * `POST /orders` - Places a new order, executes synchronous checks, clears cart, and publishes a creation event.
  * `GET /orders/{id}` - Fetches a specific order.
  * `GET /orders` - Customer order history.
  * `PUT /orders/{id}/status` - Triggers state updates (e.g. `CONFIRMED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`).
  * `PUT /orders/{id}/cancel` - User or automated order cancellation.
* **Kafka Topics Produced**:
  * `order-created` - Emits order and item payload for downstream payment and delivery processing.
  * `order-cancelled` - Emits cancellation events to trigger stock releases and notifications.
  * `order-status-updated` - Emits updates to notify customers of state transitions.

### 3.8 Payment Service
* **Service Name**: `payment-service`
* **Port**: `8090`
* **Database**: `ordereasy_payment_db`
* **Primary Responsibility**: Manages financial transaction logging. Operates asynchronously, listening to order creation events via Kafka and processing transaction mock logic. Features built-in idempotency logic to prevent duplicate payment captures.
* **Key Entities / Tables**: `payments` (mapped to `Payment.java` with columns: `id`, `order_id`, `user_id`, `amount`, `status`, `transaction_id`, `created_at`).
* **Key API Endpoints**:
  * `GET /payments/all` - Administrative transaction ledger.
  * `GET /payments/order/{orderId}` - Resolves payment details for an order.
  * `GET /payments/analytics/summary` - Aggregates payments and total revenue.
* **Kafka Topics Consumed**:
  * `order-created` (group ID: `payment-group`) -> Triggers automated transaction processing.
* **Kafka Topics Produced**:
  * `payment-completed` - Emits transaction details for delivery assignment.

### 3.9 Geo-Location Delivery Service
* **Service Name**: `delivery-service`
* **Port**: `8087`
* **Database**: `ordereasy_delivery_db`
* **Primary Responsibility**: Manages delivery partner registers, active workloads, and geographic assignments. Utilizes a strategy pattern to locate and assign the physically nearest available delivery rider.
* **Key Entities / Tables**:
  * `delivery_partners` (mapped to `DeliveryPartner.java` with columns: `id`, `name`, `phone`, `email`, `status`, `created_at`, `latitude`, `longitude`).
  * `deliveries` (mapped to `Delivery.java` with columns: `id`, `order_id`, `partner_id`, `status`, `assigned_at`, `updated_at`).
* **Key API Endpoints**:
  * `GET /deliveries/partner/{partnerId}` - Active tasks for a rider.
  * `PATCH /deliveries/{deliveryId}/status` - Rider updates progress (e.g. `ACCEPTED`, `PICKED_UP`, `DELIVERED`).
  * `POST /deliveries/assign` - Manually triggers rider assignment.
  * `GET /deliveries/analytics/partner-summary` - Summary of active and available riders.
* **Kafka Topics Consumed**:
  * `order-created` (group ID: `delivery-group`) -> Automated listener that triggers the `NearestPartnerStrategy` matching sequence immediately.

### 3.10 Real-Time Tracking Service
* **Service Name**: `tracking-service`
* **Port**: `8088`
* **Database**: `ordereasy_tracking_db`
* **Primary Responsibility**: High-throughput service that tracks rider movement. Persists historical routes as coordinate points and serves real-time locations to customer tracking screens.
* **Key Entities / Tables**: `location_logs` (mapped to `LocationLog.java` with columns: `id`, `order_id`, `partner_id`, `latitude`, `longitude`, `timestamp`, `status`).
* **Key API Endpoints**:
  * `POST /tracking/update` - Rider app posts new GPS coordinates (e.g., every 5s).
  * `GET /tracking/{orderId}` - Customer client fetches the latest rider location.
  * `GET /tracking/{orderId}/history` - Fetches the complete route path for route line rendering.
* **Kafka Topics Consumed**:
  * `order-created` (group ID: `tracking-group`) -> Prepares tracking data structures for active monitoring.

### 3.11 Notification & SMS Service
* **Service Name**: `notification-service`
* **Port**: `8089`
* **Database**: `ordereasy_notification_db`
* **Primary Responsibility**: Asynchronous dispatcher. Consumes business status events and logs alerts for users.
* **Key Entities / Tables**: `notifications` (mapped to `Notification.java` with columns: `id`, `user_id`, `user_email`, `order_id`, `message`, `type`, `is_read`, `created_at`).
* **Key API Endpoints**:
  * `GET /notifications/{userId}` - Fetches customer notifications.
  * `PATCH /notifications/{id}/read` - Marks an alert as read.
* **Kafka Topics Consumed**:
  * `order-created` (group ID: `notification-group`) -> Alerts user of receipt.
  * `order-status-updated` (group ID: `notification-group`) -> Dynamic push message for delivery updates.
  * `order-cancelled` (group ID: `notification-group`) -> Notifies user of cancellation and stock releases.

---

## ═══════════════════════════════════════════
## 4. COMPLETE FEATURE LIST
## ═══════════════════════════════════════════

### 4.1 Authentication & Security
* **Multi-Role RBAC**: Granular system permissions tailored to three specific roles: `CUSTOMER`, `ADMIN`, and `DELIVERY_PARTNER`.
* **Standard Credentials**: Classic secure signup and signin with password encryption via BCrypt.
* **Twilio SMS OTP Login**: Frictionless authentication by entering a phone number, receiving a short-code via SMS, and submitting the code for secure verification.
* **Cryptographic Session Tokens**: Secure JWT generation and reactive API Gateway authentication.

### 4.2 Shopping Cart & Inventory Checkout
* **Transient Cart Management**: Persistent cart items in an isolated database.
* **Product Catalog Search**: Fast searches, sorting, and categorization of quick-delivery items.
* **Optimistic Concurrency Control**: Stock level security against overselling on hot items.
* **Two-Phase Atomic Stock Reservation**: High-integrity bulk checkout verification. If any check fails, the transaction rolls back immediately.

### 4.3 Order & Payment Lifecycle
* **Scheduled Deliveries**: Customer selections for instant delivery or scheduled slots (e.g., `MORNING_SLOT`, `AFTERNOON_SLOT`, `EVENING_SLOT`).
* **Asynchronous Transaction Processing**: Automatic order completion triggered by order creation events.
* **Transaction Idempotency**: DB-level filters that skip duplicate payment captures.
* **Graceful Failure Handling**: Integrated circuit breakers that stop cascading microservice failures during checkouts.

### 4.4 Automated Delivery & Real-time Live Map Tracking
* **Smart Rider-to-Order Geolocation Matching**: Mathematical allocation of orders to the nearest available delivery rider.
* **Rider Dashboard**: Visual management console for riders to manage availability, accept tasks, see route coordinates, and update delivery states.
* **Rider Live Update & Simulation**: Simulation features with mathematical drift algorithms to test routes, as well as native browser Geolocation APIs.
* **Customer Interactive Map**: Responsive maps that render:
  * A green marker for the rider.
  * A red marker for the destination address.
  * A dotted path showing historical routes.
  * Auto-polling and live status indicators.

### 4.5 Administrative Management & Real-time Analytics
* **Unified Admin Console**: Comprehensive view of all platform operations.
* **Stock & Inventory CRUD Panel**: Interface to add items, modify attributes, and review stock warning lists.
* **Delivery Partner Supervision Panel**: Monitoring tool to track delivery riders and active workloads.
* **Dynamic Analytics Dashboards**: Interactive charts mapping platform performance:
  * Order status breakdowns.
  * Daily revenue and order trend lines.
  * Inventory levels.
  * Rider availability status.

---

## ═══════════════════════════════════════════
## 5. ARCHITECTURAL DECISIONS
## ═══════════════════════════════════════════

```
                 API Gateway (Routing & JWT Filter)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
      Order Service                       Delivery Service
(Synchronous REST via Feign)            (Asynchronous Event-Driven)
            │                                     │
            ├─► Cart Service (REST)               ├─► Kafka Broker
            └─► Inventory Service (REST)          │      │
                                                  │      ├─► Payment Service
                                                  │      ├─► Tracking Service
                                                  │      └─► Notification Service
                                                  ▼
                                          Delivery Partner
                                        (Nearest Geolocation)
```

### 5.1 Microservices Over Monolith
OrderEasy uses a decoupled microservices architecture rather than a monolithic structure for several key reasons:
1. **Targeted Scalability**: Q-Commerce platforms experience different demands across services. For instance, the **Tracking Service** handles thousands of high-frequency GPS coordinate writes every few seconds, which requires lightweight resources, while the **Product Service** is mostly read-heavy. In a microservices model, each service can scale independently.
2. **System Isolation**: A crash in a non-essential service (like notifications or tracking logging) should not interrupt the core order checkout flow. Decoupling these services ensures the system remains robust.
3. **Database Autonomy**: Each service controls its own schema and data storage, making it easier to maintain and update individual components.

### 5.2 Decoupled Communications: Kafka vs. OpenFeign
To optimize latency and system reliability, OrderEasy divides communication into two distinct pathways:

#### A. Synchronous Orchestration (Via OpenFeign)
* **Used By**: `order-service` -> `cart-service` & `inventory-service`.
* **Why**: Placing an order requires **immediate data validation**. The system must verify that:
  1. The user's shopping cart actually contains items.
  2. The items are available in stock.
  Using OpenFeign client proxies provides clean REST communication with high-availability configurations.

#### B. Asynchronous Event-Driven Flow (Via Apache Kafka)
* **Used By**: `order-service` -> `payment-service`, `delivery-service`, `tracking-service`, and `notification-service`.
* **Why**: Once stock is successfully reserved and the order is registered, downstream actions (such as processing payments, choosing a rider, starting historical tracking, and sending alerts) do not need to block the checkout thread. Instead, the order orchestrator publishes an event to Kafka and instantly returns a `201 Created` status to the customer, minimizing response times.

### 5.3 Database-per-Service Pattern
To avoid tight database coupling (where multiple applications share the same schemas, leading to schema lock-in and database performance bottlenecks), OrderEasy strictly enforces the **Database-per-Service** pattern.
* Every service has its own dedicated MySQL database.
* Data sharing between services is handled exclusively via **REST APIs** (synchronous validation) or **Kafka events** (asynchronous replication).
* Join operations across tables are executed in the application layer or reconstructed through event aggregation, ensuring complete storage decoupling.

---

## ═══════════════════════════════════════════
## 6. DESIGN PATTERNS USED
## ═══════════════════════════════════════════

### 6.1 Strategy Design Pattern (Open-Closed Principle)
* **Used In**: `DeliveryAssignmentStrategy.java`, `NearestPartnerStrategy.java`, and `FirstAvailableStrategy.java` in the `delivery-service`.
* **Why**: The logic for choosing a delivery rider can vary based on business needs (e.g., closest rider, least busy rider, lowest pricing, etc.). 
* **Implementation**: The system defines a unified interface (`DeliveryAssignmentStrategy`). Concrete classes implement different allocation strategies. The default runner uses `@Primary` to inject `NearestPartnerStrategy` (which calculates distances via the Haversine formula) while allowing a fallback to `FirstAvailableStrategy` without modifying the core calling service class.

### 6.2 Proxy Design Pattern
* **Used In**: `ExternalServiceProxy.java` in the `order-service` and Feign client interface mappings.
* **Why**: Raw Feign interface calls lack unified logging, fallback exception handling, and custom error translation. Wrapping these clients in a proxy class encapsulates Resilience4j circuit breaker rules and provides fallback responses, keeping the main business logic cleaner.

### 6.3 Repository Design Pattern
* **Used In**: All database-backed services via Spring Data JPA interfaces (e.g., `UserRepository`, `OrderRepository`, `StockRepository`).
* **Why**: Separates business operations from low-level database operations. Decouples entity mapping and query execution from service code, simplifying maintenance and database updates.

### 6.4 Builder Pattern
* **Used In**: All entity and event model declarations via Lombok `@Builder` annotations (e.g. `Payment.builder().orderId(id).amount(val).build()`).
* **Why**: Q-Commerce data transfers and event payloads often contain numerous optional parameters (such as geocoordinates, transit ETAs, or various status indicators). The Builder pattern allows construction of highly complex, immutable objects while maintaining code readability.

### 6.5 Observer Design Pattern
* **Used In**: Dynamic event publishing and consumption via Kafka topic listeners.
* **Why**: Decouples the order lifecycle. The core order engine acts as the subject, broadcasting state transitions (e.g. `order-created`, `order-status-updated`) to a group of registered observer microservices (e.g., payment, notification, tracking), which process these events independently.

---

## ═══════════════════════════════════════════
## 7. ADVANCED TECHNICAL FEATURES
## ═══════════════════════════════════════════

### 7.1 Optimistic Locking
* **Entity**: `Stock.java` in the `inventory-service`.
* **Field**: `@Version private Long version;`
* **What It Prevents**: Prevents **Lost Updates and Concurrent Race Conditions** during rapid inventory checkout. If two users attempt to purchase the same limited-quantity item simultaneously:
  1. Both read the same stock amount and version value.
  2. User A completes validation, updates the count, increments the database version to `1`, and successfully saves.
  3. User B then attempts to update using the old version value. Hibernate detects the version mismatch and throws an `OptimisticLockingFailureException`.
  4. The system catches this exception, rolls back User B's transaction, and prompts them to retry, preserving database integrity.

### 7.2 Haversine Mathematical Proximity Formula
* **Class**: `HaversineUtil.java` inside `delivery-service`.
* **Objective**: Calculates the great-circle distance between two coordinate points on the Earth's surface (e.g., from a rider to a customer's address) to determine proximity.
* **Implementation Details**:
  ```java
  public class HaversineUtil {
      private static final int EARTH_RADIUS_KM = 6371;

      public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
          double dLat = Math.toRadians(lat2 - lat1);
          double dLon = Math.toRadians(lon2 - lon1);
          double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                   + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                   * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return EARTH_RADIUS_KM * c;
      }
  }
  ```
* **Use Case**: Used inside `NearestPartnerStrategy` to iterate through all active and available delivery partners, compare their coordinates with the customer's order delivery coordinates, and automatically assign the closest rider.

### 7.3 Resilience4j Circuit Breaker Configurations
* **Protected Services**: `order-service` (calls to `cart-service` and `inventory-service`) and `cart-service` (calls to `product-service`).
* **Configurations**:
  * `slidingWindowSize = 10` (collects metrics on the last 10 requests).
  * `failureRateThreshold = 50.0` (trips the circuit if 50% or more requests fail).
  * `waitDurationInOpenState = 10s` (holds the circuit in an `OPEN` state for 10 seconds before attempting requests again).
  * `permittedNumberOfCallsInHalfOpenState = 3` (allows 3 test requests to check system recovery when in the `HALF_OPEN` state).
* **Fallback Mechanisms**: 
  * `handleCartFallback(userId, Exception)`: If the cart service fails, the system logs a warning and throws a `ServiceUnavailableException("Cart service unavailable")` to abort the order before payments are processed.
  * `handleInventoryFallback(request, Exception)`: If the stock service fails, the system blocks checkout and throws a `ServiceUnavailableException` to prevent overselling.

### 7.4 Transaction Idempotency
* **Service**: `payment-service` via `PaymentService.java`.
* **Objective**: Prevents duplicate payments if an order event is processed multiple times.
* **Implementation**: The payment processor uses the unique `orderId` from the order creation event as an idempotency key.
  ```java
  if (paymentRepository.findByOrderId(event.getOrderId()).isPresent()) {
      log.warn("Payment already processed for order: {}", event.getOrderId());
      return; // Skip duplicate processing
  }
  ```
  This validation step ensures that even if Kafka redelivers the event, the transaction is processed exactly once, maintaining database consistency.

### 7.5 Two-Phase Atomic Stock Reservation
* **Class & Endpoint**: `StockServiceImpl.java` -> `reserveStockBulk` endpoint via `POST /stock/reserve-bulk`.
* **Objective**: Reserves all items in a customer's cart as a single, atomic operation.
* **How It Works**:
  * **Phase 1: Validation Phase**: The system loops through all items in the request, fetches their current stock level, and calculates if enough quantity remains (`quantity - reservedQuantity >= requestedQuantity`). If any item has insufficient stock, it throws an `InsufficientStockException` immediately, aborting the process before any database updates occur.
  * **Phase 2: Allocation Phase**: Once all items are validated, the system loops through them again, increments their `reservedQuantity` in the database, and persists the changes.
  * **Transaction Integrity**: The entire method is annotated with `@Transactional`. If an exception is thrown in Phase 1, the database transaction rolls back automatically, ensuring atomic checkout.

### 7.6 JWT Implementation Details
* **Subject**: The user's registered email address.
* **Additional Claims**: `role` (user role) and `userId` (the database primary key, allowing the frontend to quickly filter user-specific data).
* **Filter Chain Details**: Implemented using a custom filter class (`JwtFilter.java`) that extends Spring's `OncePerRequestFilter`:
  1. Intercepts incoming requests and parses the `Authorization` header.
  2. Extracts the `Bearer` token.
  3. Validates the signature using the shared `jwt.secret` key.
  4. Sets the user authentication details in Spring Security's `SecurityContextHolder`.
* **Gateway-Level Validations**: The API Gateway uses a reactive filter (`JwtAuthenticationFilter.java`) to intercept requests before they route to internal microservices, verify signatures, and block access to unauthorized paths.

---

## ═══════════════════════════════════════════
## 8. KAFKA EVENT FLOW & LIFECYCLE
## ═══════════════════════════════════════════

The lifecycle of an order is coordinated asynchronously using Kafka event streams.

```
Order Service                           Payment Service                      Delivery Service
   │                                           │                                    │
   ├─► [Event: order-created] ────────────────►│ (Process Payment)                  │
   │                                           ├─► [Event: payment-completed] ─────►│ (Assign Rider)
   │                                           ▼                                    │
   ├─► [Event: order-status-updated] ──────────────────────────────────────────────►│ (Sync Location)
   ▼                                                                                ▼
(Notification: User Alerted)                                            (Tracking: Logs Location)
```

### 8.1 Active Topics
1. **`order-created`**: Emitted by `order-service` on successful checkout.
2. **`payment-completed`**: Emitted by `payment-service` when payment is captured.
3. **`order-cancelled`**: Emitted by `order-service` when an order is cancelled.
4. **`order-status-updated`**: Emitted by `order-service` on status updates.

### 8.2 Producer and Consumer Mappings

| Topic | Producer (Service + Method) | Consumer (Service + Method + Group ID) |
| :--- | :--- | :--- |
| **`order-created`** | `order-service`<br>`OrderKafkaProducer.sendOrderCreatedEvent` | `payment-service` -> `PaymentKafkaConsumer.consume` (`payment-group`) <br><br> `delivery-service` -> `OrderKafkaConsumer.consume` (`delivery-group`) <br><br> `tracking-service` -> `TrackingKafkaConsumer.consume` (`tracking-group`) <br><br> `notification-service` -> `NotificationConsumer.consume` (`notification-group`) |
| **`payment-completed`** | `payment-service`<br>`PaymentService.processPayment` | *Available for downstream tracking extensions* |
| **`order-cancelled`** | `order-service`<br>`OrderKafkaProducer.sendOrderCancelledEvent` | `inventory-service` -> `OrderKafkaConsumer.consume` (`inventory-group`) <br><br> `notification-service` -> `NotificationConsumer.consume` (`notification-group`) |
| **`order-status-updated`** | `order-service`<br>`OrderKafkaProducer.sendOrderStatusUpdatedEvent` | `notification-service` -> `NotificationConsumer.consume` (`notification-group`) |

### 8.3 Order Lifecycle Event Flow
1. **Checkout**: A customer places an order. The order is saved in the database with a status of `PLACED`.
2. **Event Emitted**: The `order-service` emits an `order-created` event to Kafka.
3. **Processing Payment**: The `payment-service` consumes this event, processes the transaction, saves the payment, and emits a `payment-completed` event.
4. **Reserving Stock**: The `inventory-service` consumes the `order-created` event, validates quantities, and reserves the stock.
5. **Assigning a Rider**: The `delivery-service` consumes the event and triggers its assignment logic to choose the nearest available rider.
6. **Updating Status**: The assigned rider accepts the delivery, changing the order status to `CONFIRMED`.
7. **Transit Updates**: As the rider collects the order and moves, they post coordinate updates to the tracking service. The order status updates to `SHIPPED`, then `OUT_FOR_DELIVERY`.
8. **Delivery**: The rider marks the order as complete. The order status changes to `DELIVERED`, and the rider's status is reset to `AVAILABLE`.

---

## ═══════════════════════════════════════════
## 9. FRONTEND INTEGRATION DETAILS
## ═══════════════════════════════════════════

The frontend is a single-page application built with React and Tailwind CSS, featuring **17 pages** divided across three user roles:

### 9.1 Page Distributions
* **Public & Authentication Pages (2)**:
  1. `LoginPage.jsx` (supports standard credentials and Twilio SMS OTP logins).
  2. `RegisterPage.jsx` (supports profile creation and role assignment).
* **Customer Interface (7)**:
  1. `HomePage.jsx` (product lists, categories, and shopping cart widgets).
  2. `ProductDetailPage.jsx` (displays price, details, and stock indicators).
  3. `CartPage.jsx` (item lists, price calculations, and checkout triggers).
  4. `PlaceOrderPage.jsx` (allows scheduling delivery slots and entering addresses).
  5. `MyOrdersPage.jsx` (lists customer order history).
  6. `OrderDetailPage.jsx` (displays status timelines and details).
  7. `TrackOrderPage.jsx` (the interactive tracking map).
* **Rider Interface (4)**:
  1. `PartnerDashboardPage.jsx` (lists assigned orders).
  2. `MyDeliveriesPage.jsx` (allows riders to accept, update, and manage active tasks).
  3. `AvailabilityPage.jsx` (allows riders to toggle their status between `AVAILABLE` and `BUSY`).
  4. `UpdateLocationPage.jsx` (rider GPS updater with manual, browser, and simulation modes).
* **Admin Interface (4)**:
  1. `AdminDashboard.jsx` (displays business performance and system status charts).
  2. `InventoryPage.jsx` (allows admins to manage stock and edit items).
  3. `DeliveryPartnersPage.jsx` (tracks rider coordinates and workloads).
  4. `AllOrdersPage.jsx` (allows admins to view and manage all system orders).

### 9.2 Key Frontend Technical Implementations
* **JWT Storage and Retrieval**: Encapsulated within `AuthContext.jsx`. The login process stores the JWT token, decoded user object, and roles in `localStorage`.
* **Axios Request Interceptor**: Mapped in `api/axios.js` to automatically inject the JWT token as a `Bearer` header on outgoing requests.
* **Axios Response Interceptor**: Intercepts `401 Unauthorized` responses to clear `localStorage` and log the user out automatically.
* **Live Interactive Tracking**: Utilizes `react-leaflet` to render a tracking map for customers. Polling runs every 3 seconds to fetch rider coordinates, displaying a green marker for the rider, a red marker for the destination, and a dotted route history line.
* **Rider GPS Simulation**: The rider interface features a simulation mode with a mathematical drift algorithm that updates and posts mock coordinates every 5 seconds.
* **Admin Data Visualizations**: The admin dashboard imports Recharts components to visualize system data:
  * `AreaChart`: Displays a 7-day trend of order volume.
  * `PieChart` (Donut): Displays order status distributions.
  * `BarChart`: Renders product stock levels, highlighting low stock in red.

---

## ═══════════════════════════════════════════
## 10. API GATEWAY ROUTING & SECURITY
## ═══════════════════════════════════════════

The API Gateway is configured Reactive Webflux-style to route and secure entry points.

### 10.1 Active Route Configuration
Mapped in `api-gateway/src/main/resources/application.properties`:

```properties
server.port=8084

# Route mappings
spring.cloud.gateway.server.webflux.routes[0].id=auth-service
spring.cloud.gateway.server.webflux.routes[0].uri=lb://auth-service
spring.cloud.gateway.server.webflux.routes[0].predicates[0]=Path=/auth/**

spring.cloud.gateway.server.webflux.routes[1].id=order-service
spring.cloud.gateway.server.webflux.routes[1].uri=lb://order-service
spring.cloud.gateway.server.webflux.routes[1].predicates[0]=Path=/orders/**

spring.cloud.gateway.server.webflux.routes[3].id=inventory-service-stock
spring.cloud.gateway.server.webflux.routes[3].uri=lb://inventory-service
spring.cloud.gateway.server.webflux.routes[3].predicates[0]=Path=/stock/**

spring.cloud.gateway.server.webflux.routes[4].id=tracking-service
spring.cloud.gateway.server.webflux.routes[4].uri=lb://tracking-service
spring.cloud.gateway.server.webflux.routes[4].predicates[0]=Path=/tracking/**

spring.cloud.gateway.server.webflux.routes[5].id=delivery-service
spring.cloud.gateway.server.webflux.routes[5].uri=lb://delivery-service
spring.cloud.gateway.server.webflux.routes[5].predicates[0]=Path=/deliveries/**

spring.cloud.gateway.server.webflux.routes[6].id=notification-service
spring.cloud.gateway.server.webflux.routes[6].uri=lb://notification-service
spring.cloud.gateway.server.webflux.routes[6].predicates[0]=Path=/notifications/**

spring.cloud.gateway.server.webflux.routes[7].id=cart-service
spring.cloud.gateway.server.webflux.routes[7].uri=lb://cart-service
spring.cloud.gateway.server.webflux.routes[7].predicates[0]=Path=/cart/**

spring.cloud.gateway.server.webflux.routes[8].id=payment-service
spring.cloud.gateway.server.webflux.routes[8].uri=lb://payment-service
spring.cloud.gateway.server.webflux.routes[8].predicates[0]=Path=/payments/**
```

### 10.2 Global Gateway CORS Configuration
```properties
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowedOrigins=http://localhost:5173,http://localhost:5174,http://localhost:3000
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowedMethods=*
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowedHeaders=*
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowCredentials=true
```

### 10.3 Gateway JWT Verification
The API Gateway runs a reactive security filter (`JwtAuthenticationFilter.java`) to intercept and secure routes:
1. **CORS Preflight Bypass**: Requests utilizing the HTTP `OPTIONS` method bypass JWT verification directly.
2. **Public Routes Bypass**: Skips verification for paths starting with `/auth/**`.
3. **Token Validation**: Extracts the token from the `Authorization` header, parses claims, and validates the signature using the shared JWT secret key.
4. **Access Restrictions**:
  * `/orders/**`: Restricted to `CUSTOMER` and `ADMIN` roles, except for order status changes (`/orders/{id}/status`), which are also allowed for the `DELIVERY_PARTNER` role.
  * `/admin/**`: Restricted to `ADMIN` roles.
  * `/stock/**` and write operations on `/products/**`: Restricted to `ADMIN` roles.
  * `/deliveries/**`: Restricted to `ADMIN` and `DELIVERY_PARTNER` roles.

---

## ═══════════════════════════════════════════
## 11. STARTUP AND DEPLOYMENT GUIDE
## ═══════════════════════════════════════════

### 11.1 Prerequisites
* **Java SDK**: version `21` or higher.
* **Database Engine**: **MySQL 8.x** running locally on port `3306`.
* **Container Tool**: **Docker & Docker Compose** (for running the Kafka cluster).
* **Node runtime**: **NodeJS 18+** with npm package manager.

### 11.2 Environment Configurations
Create a `.env` file in the project's root folder:
```bash
JWT_SECRET=mysecretkeymysecretkeymysecretkeymysecretkeymysecretkey
DB_USERNAME=spring_user
DB_PASSWORD=Spring@2024
TWILIO_ACCOUNT_SID=AC57a8c43b999b3f6a37d4e298dc95282f
TWILIO_AUTH_TOKEN=9a938bd2a59706ec590ce0834e1b255d
TWILIO_VERIFY_SERVICE_SID=VAded395b1493426a38e0e06fcda9335c8
```

### 11.3 Database Setup
Ensure the following databases are created in your MySQL instance:
* `ordereasy_auth_db`
* `ordereasy_order_db`
* `ordereasy_inventory_db`
* `ordereasy_delivery_db`
* `ordereasy_tracking_db`
* `ordereasy_notification_db`
* `ordereasy_cart_db`
* `ordereasy_payment_db`

### 11.4 Startup Sequence
To ensure services register and connect correctly, launch them in this order:

#### Step 1: Start Infrastructure (Kafka Cluster)
```bash
cd infrastructure/kafka
docker-compose up -d
```

#### Step 2: Start Discovery Server (Eureka)
Allow Eureka 15 seconds to fully initialize before starting downstream services.
```bash
cd ../../backend/discovery-server
./mvnw spring-boot:run
```

#### Step 3: Start Microservices (Concurrent Launch)
Start services in the following order:
1. `auth-service`
2. `api-gateway`
3. `inventory-service`
4. `cart-service`
5. `order-service`
6. `payment-service`
7. `delivery-service`
8. `tracking-service`
9. `notification-service`

#### Step 4: Start Frontend
```bash
cd ../../frontend
npm install
npm run dev
```

### 11.5 Orchestration Scripts
The project includes shell scripts in the root directory to automate service management:
* **`start-all.sh`**: Loads environment variables from `.env`, starts the Kafka cluster using Docker Compose, launches the Eureka Discovery Server, and starts all Spring Boot microservices, introducing small delays to allow initialization.
* **`stop-all.sh`**: Safely stops all running Spring Boot processes and shuts down the Dockerized Kafka cluster.
* **`status-check.sh`**: Tests active HTTP ports and `/actuator/health` endpoints to report the runtime status of all services.

---

## ═══════════════════════════════════════════
## 12. DATABASE SCHEMA SUMMARY
## ═══════════════════════════════════════════

OrderEasy uses a database-per-service pattern, organizing schemas into **8 isolated databases**:

### 12.1 Authentication DB (`ordereasy_auth_db`)
* **Table**: `users`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `email` (`VARCHAR(255)`, Unique, Not Null)
  * `password` (`VARCHAR(255)`, Encrypted)
  * `role` (`VARCHAR(50)`, e.g., `CUSTOMER`, `ADMIN`, `DELIVERY_PARTNER`)
  * `phone_number` (`VARCHAR(15)`, Unique, Nullable)

### 12.2 Cart DB (`ordereasy_cart_db`)
* **Table**: `cart_items`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `user_id` (`BIGINT`)
  * `product_id` (`BIGINT`)
  * `quantity` (`INT`)

### 12.3 Catalog & Stock DB (`ordereasy_inventory_db`)
* **Table**: `products`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `name` (`VARCHAR(255)`)
  * `category` (`VARCHAR(255)`)
  * `price` (`DOUBLE`)
  * `description` (`TEXT`)
  * `created_at` (`DATETIME`)
* **Table**: `stock`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `product_id` (`BIGINT`, FK/Index)
  * `quantity` (`INT`) - *Physical quantity present in warehouse*
  * `reserved_quantity` (`INT`) - *Locked items during processing*
  * `updated_at` (`DATETIME`)
  * `version` (`BIGINT`) - *Optimistic locking version field*

### 12.4 Order DB (`ordereasy_order_db`)
* **Table**: `orders`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `user_id` (`BIGINT`)
  * `user_email` (`VARCHAR(255)`)
  * `total_amount` (`DOUBLE`)
  * `status` (`VARCHAR(20)`)
  * `delivery_slot` (`VARCHAR(30)`)
  * `created_at` (`DATETIME`)
* **Table**: `order_items`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `order_id` (`BIGINT`, FK to `orders`)
  * `product_id` (`BIGINT`)
  * `quantity` (`INT`)
  * `price` (`DOUBLE`)

### 12.5 Payment DB (`ordereasy_payment_db`)
* **Table**: `payments`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `order_id` (`BIGINT`)
  * `user_id` (`BIGINT`)
  * `amount` (`DOUBLE`)
  * `status` (`VARCHAR(20)`)
  * `transaction_id` (`VARCHAR(255)`)
  * `created_at` (`DATETIME`)

### 12.6 Delivery DB (`ordereasy_delivery_db`)
* **Table**: `delivery_partners`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `name` (`VARCHAR(255)`)
  * `phone` (`VARCHAR(50)`)
  * `email` (`VARCHAR(255)`)
  * `status` (`VARCHAR(20)`)
  * `latitude` (`DOUBLE`)
  * `longitude` (`DOUBLE`)
  * `created_at` (`DATETIME`)
* **Table**: `deliveries`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `order_id` (`BIGINT`)
  * `partner_id` (`BIGINT`, FK to `delivery_partners`)
  * `status` (`VARCHAR(50)`)
  * `assigned_at` (`DATETIME`)
  * `updated_at` (`DATETIME`)

### 12.7 Tracking DB (`ordereasy_tracking_db`)
* **Table**: `location_logs`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `order_id` (`BIGINT`)
  * `partner_id` (`BIGINT`)
  * `latitude` (`DOUBLE`)
  * `longitude` (`DOUBLE`)
  * `timestamp` (`DATETIME`)
  * `status` (`VARCHAR(50)`)

### 12.8 Notification DB (`ordereasy_notification_db`)
* **Table**: `notifications`
  * `id` (`BIGINT`, PK, Auto-Increment)
  * `user_id` (`BIGINT`)
  * `user_email` (`VARCHAR(255)`)
  * `order_id` (`BIGINT`)
  * `message` (`TEXT`)
  * `type` (`VARCHAR(20)`)
  * `is_read` (`BOOLEAN`)
  * `created_at` (`DATETIME`)
