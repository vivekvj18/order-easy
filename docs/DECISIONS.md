# 🧠 Architectural Decisions

---

## 🔹 DTO Usage

Decision:
Used DTOs instead of exposing entities.

Reason:
- Prevent exposing internal fields
- Control API contract
- Improve security

---

## 🔹 Layered Architecture

Decision:
Controller → Service → Repository

Reason:
- Separation of concerns
- Maintainability
- Scalability

---

## 🔹 Database Design

Decision:
Database-per-service (planned, partially followed)

Reason:
- Loose coupling
- Microservices scalability
- Independent deployment

---

## 🔹 Validation

Decision:
Used Jakarta Validation annotations

Reason:
- Prevent invalid data
- Maintain data integrity

---

## 🔹 Exception Handling

Decision:
Global exception handling using @RestControllerAdvice

Reason:
- Consistent error responses
- Better debugging
- Avoid server crashes

---

## 🔹 Pagination & Sorting

Decision:
Used Spring Data JPA Pageable & Sort

Reason:
- Avoid loading large data in memory
- Improve performance
- Enable scalable APIs

---

## 🔹 Filtering Strategy

Decision:
Used query parameters + repository methods

Reason:
- Flexible API design
- Supports real-world use cases
- Easy to extend

---

## 🔹 Range Filtering

Decision:
Implemented amount and date range filtering

Reason:
- Handle real-world queries
- Improve data querying flexibility

---

## 🔹 Service Separation (Planned)

Decision:
Separate services (Order, Auth, Inventory)

Reason:
- Microservices readiness
- Independent scaling
- Better system design

---

## 🔹 No OrderItems Initially

Decision:
Did not include OrderItem in initial phase

Reason:
- Avoid premature complexity
- Introduce later with Inventory Service
