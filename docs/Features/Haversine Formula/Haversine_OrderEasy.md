# Haversine Formula — OrderEasy
### What it is, why we used it, and how we integrated it

---

## What is the Haversine Formula?

Haversine is a mathematical formula that calculates the **shortest distance
between two points on Earth** using their latitude and longitude coordinates.

Earth is a sphere — not flat. Simple straight-line distance (Pythagoras) does
not work for GPS coordinates because it ignores Earth's curvature. Haversine
accounts for this curvature and gives the true "as-the-crow-flies" distance
between two locations.

```
Input  → lat1, lng1 (Point A — customer location)
         lat2, lng2 (Point B — delivery partner location)

Output → distance in kilometers
```

### The Formula in Code

```java
public static double calculateDistance(
        double lat1, double lon1,
        double lat2, double lon2) {

    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);

    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1))
            * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return 6371 * c; // Earth's radius in km
}
```

### Why Each Line Exists

```
Math.toRadians()     → GPS gives degrees. Math functions need radians.
Math.sin() / cos()   → Trigonometry to account for sphere curvature.
Math.atan2()         → Converts back from radians to angular distance.
6371 * c             → Multiply by Earth's radius → distance in KM.
```

---

## Why We Used This in OrderEasy

### Problem Before Haversine

```
Product in stock: 1 item
Available partners: Ravi (15 km), Amit (0.5 km), Rahul (8 km)

FirstAvailableStrategy → picks Ravi (first in DB)
Result → 15 km away. Cannot deliver in 10 minutes. ❌
```

Quick commerce (Blinkit, Zepto) promises 10-minute delivery.
Assigning the furthest partner defeats the entire purpose.

### After Haversine

```
NearestPartnerStrategy → calculates distance to all partners
  Ravi  → 15.2 km
  Amit  →  0.5 km  ← NEAREST
  Rahul →  8.7 km

Result → Amit assigned. Fast delivery guaranteed. ✅
```

---

## How We Integrated It — Step by Step

### Step 1 — Added lat/lng to DeliveryPartner entity

```java
// DeliveryPartner.java
private Double latitude;
private Double longitude;
```

MySQL table automatically got two new columns via `ddl-auto=update`.
Each partner now has a stored GPS location.

### Step 2 — Added lat/lng to OrderCreatedEvent

```java
// OrderCreatedEvent.java (in both order-service and delivery-service)
private Double deliveryLatitude;
private Double deliveryLongitude;
```

The Kafka event now carries the customer's delivery coordinates.

### Step 3 — Added lat/lng to CreateOrderRequest

```java
// CreateOrderRequest.java
private Double deliveryLatitude;   // optional — no @NotNull
private Double deliveryLongitude;
```

Customer sends coordinates with the order request.
Frontend will capture these via browser Geolocation API automatically.
For testing, coordinates are sent manually via Swagger.

### Step 4 — Wired coordinates into Kafka event in OrderService

```java
// OrderService.java — inside createOrder()
event.setDeliveryLatitude(request.getDeliveryLatitude());
event.setDeliveryLongitude(request.getDeliveryLongitude());
```

Coordinates flow from request → event → Kafka topic.

### Step 5 — Created HaversineUtil.java

```
delivery-service/src/main/java/
  com/ordereasy/delivery_service/util/HaversineUtil.java
```

Pure static utility class. No Spring bean. No DB access.
Takes 4 doubles, returns distance in KM.

### Step 6 — Created NearestPartnerStrategy.java

```java
@Slf4j
@Component
@Primary  // ← tells Spring: use this one by default
public class NearestPartnerStrategy implements DeliveryAssignmentStrategy {

    @Override
    public DeliveryPartner assign(List<DeliveryPartner> partners,
                                   OrderCreatedEvent order) {

        // Fallback 1: no partners available
        if (partners == null || partners.isEmpty()) {
            throw new RuntimeException("No delivery partner available");
        }

        // Fallback 2: no customer coordinates → first available
        if (order == null || order.getDeliveryLatitude() == null) {
            return partners.get(0);
        }

        // Fallback 3: no partner has GPS → first available
        List<DeliveryPartner> withLocation = partners.stream()
            .filter(p -> p.getLatitude() != null)
            .toList();
        if (withLocation.isEmpty()) return partners.get(0);

        // Core: find nearest using Haversine
        DeliveryPartner nearest = withLocation.stream()
            .min(Comparator.comparingDouble(p ->
                HaversineUtil.calculateDistance(
                    p.getLatitude(), p.getLongitude(),
                    order.getDeliveryLatitude(), order.getDeliveryLongitude()
                )))
            .orElse(partners.get(0));

        // Log distance for observability
        double distance = HaversineUtil.calculateDistance(
            nearest.getLatitude(), nearest.getLongitude(),
            order.getDeliveryLatitude(), order.getDeliveryLongitude());

        log.info("Nearest partner: {} selected at distance: {} km for orderId: {}",
            nearest.getName(), String.format("%.2f", distance), order.getOrderId());

        return nearest;
    }
}
```

### Step 7 — Fixed Kafka consumer to listen to order-created topic

```java
// OrderKafkaConsumer.java
@KafkaListener(topics = "order-created", groupId = "delivery-group")
public void handleOrderCreated(OrderCreatedEvent event) {
    log.info("Received order-created event for orderId: {}", event.getOrderId());
    deliveryService.assignDelivery(event);
}
```

### Step 8 — Fixed application.properties deserialization

```properties
spring.kafka.consumer.properties.spring.json.value.default.type=
  com.ordereasy.delivery_service.event.OrderCreatedEvent
```

---

## Files Modified / Created

```
order-service:
  CreateOrderRequest.java        → added deliveryLatitude, deliveryLongitude
  OrderCreatedEvent.java         → added deliveryLatitude, deliveryLongitude
  OrderService.java              → wires coordinates into Kafka event

delivery-service:
  DeliveryPartner.java           → added latitude, longitude fields
  OrderCreatedEvent.java         → added deliveryLatitude, deliveryLongitude
  util/HaversineUtil.java        → NEW — Haversine calculation
  strategy/NearestPartnerStrategy.java → NEW — uses Haversine to pick partner
  kafka/OrderKafkaConsumer.java  → added order-created listener
  application.properties         → added default type for deserialization
  FirstAvailableStrategy.java    → unchanged (used as fallback inside Nearest)
  DeliveryAssignmentStrategy.java → unchanged (interface)
  DeliveryService.java           → unchanged (Strategy Pattern — zero change)
```

---

## Proof It Works — MySQL Result

```sql
SELECT d.id, d.order_id, dp.name, dp.latitude, dp.longitude
FROM deliveries d
JOIN delivery_partners dp ON d.partner_id = dp.id
ORDER BY d.id DESC LIMIT 1;

+----+----------+-------------+----------+-----------+
| id | order_id | name        | latitude | longitude |
+----+----------+-------------+----------+-----------+
| 10 |       50 | Amit Sharma |  12.9352 |   77.6245 |
+----+----------+-------------+----------+-----------+
```

Customer sent coordinates `12.9352, 77.6245` → Amit Sharma
(who is AT those coordinates) was correctly selected as nearest. ✅

---

## Console Log Proof

```
INFO OrderKafkaConsumer     - Received order-created event for orderId: 50
INFO NearestPartnerStrategy - Nearest partner: Amit Sharma selected
                              at distance: 0.00 km for orderId: 50
```

---

## Design Pattern Connection — Strategy + OCP

```
DeliveryAssignmentStrategy (interface)
    ↑
    ├── FirstAvailableStrategy   → @Component (fallback behaviour)
    └── NearestPartnerStrategy   → @Component @Primary (default)

DeliveryService → only knows about the interface
                → zero change needed when strategy switched
                → Open/Closed Principle in practice
```

---

## What to Say in Interview

> "I implemented the Haversine formula in a stateless utility class
> `HaversineUtil` that calculates great-circle distance between two GPS
> coordinates, accounting for Earth's curvature.
>
> When a customer places an order, their GPS coordinates travel via the
> Kafka `order-created` event to the Delivery Service. The
> `NearestPartnerStrategy` iterates over all available delivery partners,
> calls `HaversineUtil.calculateDistance()` for each, and assigns the
> partner with the minimum distance using Java Streams `min()`.
>
> I used the Strategy Pattern so switching from `FirstAvailableStrategy`
> to Haversine-based assignment required adding one new class — zero
> changes to `DeliveryService` or the interface. That's the Open/Closed
> Principle. If coordinates are missing, the strategy falls back gracefully
> to first available — no exceptions, no system failure."

---

## Jargon Checklist for Interviews

- "Haversine formula" — great-circle distance on a sphere
- "Great-circle distance" — shortest path between two GPS points on Earth
- "Strategy Pattern" — pluggable algorithm behind an interface
- "Open/Closed Principle" — add new strategy without modifying existing code
- "@Primary" — Spring injects this bean when multiple implementations exist
- "Graceful degradation" — system falls back safely when data is missing
- "Geolocation API" — browser API that gives GPS coordinates (frontend)
- "Defensive programming" — 3-level fallback chain in NearestPartnerStrategy
