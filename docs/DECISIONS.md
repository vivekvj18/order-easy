# 🧠 Architectural Decisions

---

## 🔹 DTO Usage

Decision:
Used DTOs instead of exposing entities.

Reason:

* Prevent exposing internal fields
* Control API contract
* Improve security

---

## 🔹 Layered Architecture

Decision:
Controller → Service → Repository

Reason:

* Separation of concerns
* Maintainability
* Scalability

---

## 🔹 Database Design

Decision:
Separate database per service (planned)

Reason:

* Loose coupling
* Microservices scalability

---

## 🔹 Validation

Decision:
Used Jakarta Validation annotations

Reason:

* Prevent invalid data
* Maintain data integrity

---

## 🔹 Exception Handling

Decision:
Basic global exception handling

Reason:

* Improve API response clarity
* Avoid server crashes

---

## 🔹 No OrderItems Initially

Decision:
Did not include OrderItem in initial phase

Reason:

* Avoid premature complexity
* Introduce later with Inventory Service

