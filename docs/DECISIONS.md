# 🧠 Architectural Decisions

---

## 🔹 DTO Usage
(keep your existing content)

---

## 🔹 Layered Architecture
(keep existing)

---

## 🔹 Database Design
(keep existing)

---

## 🔹 Validation
(keep existing)

---

## 🔹 Exception Handling
(keep existing)

---

## 🔹 Pagination & Sorting
(keep existing)

---

## 🔹 Filtering Strategy
(keep existing)

---

## 🔹 Range Filtering
(keep existing)

---

## 🔹 Service Separation (Planned)
(keep existing)

---

## 🔹 No OrderItems Initially
(keep existing)

---

# 🚀 NEW DECISIONS (ADDED)

## 🔹 Delivery Assignment Strategy
Used Strategy Pattern

Reason:
- Easily extendable
- Clean design
- Supports multiple strategies

---

## 🔹 Event-Driven Communication
Used Kafka

Reason:
- Loose coupling
- Scalability
- Async processing

---

## 🔹 Delivery Lifecycle
ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED

Reason:
- Real-world tracking
- Clear state transitions

---

## 🔹 Partner State Sync
- ASSIGNED → BUSY  
- DELIVERED → AVAILABLE  

Reason:
- Prevent overload
- Enable reuse

---

## 🔹 Future: Distance-Based Assignment
(Haversine)

Reason:
- Nearest partner selection
- Faster delivery

---

## 🔹 Future: Delivery Attempts
Retry mechanism

Reason:
- Handle failures
- Improve success rate

---

## 🔹 Future: Concurrency Handling
Using locking

Reason:
- Avoid race conditions
- Maintain consistency

