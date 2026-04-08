# 🏗️ OrderEasy — Architecture

(keep all your existing content) :contentReference[oaicite:2]{index=2}

---

# 🚀 NEW SECTION — Delivery Service (B6)

## Responsibilities:
- Assign delivery partners
- Manage lifecycle
- Update partner status
- Handle delivery APIs

---

## 🔄 Event Flow

Order Service → Kafka → Delivery Service

---

## 🚀 Future Enhancements

### 1. Distance-Based Assignment
- Haversine formula
- Nearest partner selection

### 2. Delivery Slot Optimization
- SLA-based delivery
- Expected time calculation

### 3. Retry System
- Delivery attempts tracking
- Reassignment logic

### 4. Concurrency Handling
- Prevent duplicate assignment
- Use DB locking

