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

```
Order Service
  └── Publishes "order-created" (Kafka)
          │
          └──▶ Payment Service (topic: order-created, group: payment-group)
                  └── processPayment()
                        ├── Saves Payment record
                        └── Publishes "payment-completed" (includes deliveryLatitude, deliveryLongitude)
                                │
                                └──▶ Delivery Service (topic: payment-completed, group: delivery-group)
                                        └── handlePaymentCompleted()
                                              ├── Guards: status == "SUCCESS" only
                                              └── assignDeliveryFromPayment() → NearestPartnerStrategy (Haversine)
```

> **Note:** Delivery Service listens to `payment-completed`, NOT `order-created`.
> Rider assignment only occurs after payment succeeds.

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

