# Feign Integration — OrderEasy

## What is OpenFeign?

OpenFeign ek Spring Cloud library hai jo ek microservice ko doosri microservice se **synchronous HTTP call** karne ki capability deta hai — bina manually HTTP request likhne ke. Tum bas ek interface define karo, Feign khud implementation banata hai.

**Simple analogy:** Feign ek telephone directory ki tarah hai — tum sirf naam se call karo, Feign number dhundega aur connect karega.

---

## Why Feign in OrderEasy?

| Communication | Technology | Reason |
|---|---|---|
| Order → Inventory | **Feign (sync)** | Stock confirm hona zaroori hai — order tab hi banega |
| Order → Delivery | Kafka (async) | Partner baad mein bhi assign ho sakta hai |
| Order → Notification | Kafka (async) | Non-critical, delay acceptable |

Stock check **synchronous** hona zaroori hai kyunki:
- Customer ko turant confirm karna padta hai ki order place hua ya nahi
- Partial reservation se data inconsistency hogi
- "Check first, then commit" principle follow karna padta hai

---

## Integration Steps

### Step 1 — pom.xml (Order Service)
Spring Cloud BOM aur Feign dependency add ki.

```xml
<dependencyManagement>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-dependencies</artifactId>
        <version>2023.0.3</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencyManagement>

<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

**Why:** Feign Spring Boot mein by default nahi hota — Spring Cloud ka part hai.

---

### Step 2 — OrderServiceApplication.java
`@EnableFeignClients` annotation add kiya.

```java
@SpringBootApplication
@EnableFeignClients
public class OrderServiceApplication { ... }
```

**Why:** Spring ko explicitly batana padta hai ki project mein Feign clients hain — unke beans banao. Bina iske `InventoryFeignClient` inject nahi hoga.

---

### Step 3 — application.properties (Order Service)
Inventory Service ka URL externalize kiya.

```properties
inventory.service.url=http://localhost:8086
```

**Why:** URL hardcode karne ki jagah properties mein rakha — environment change pe sirf config change karni padegi, code nahi.

---

### Step 4 — InventoryFeignClient.java (NEW FILE)
```java
@FeignClient(name = "inventory-service", url = "${inventory.service.url}")
public interface InventoryFeignClient {

    @PostMapping("/stock/reserve-bulk")
    StockReservationResponse reserveStockBulk(@RequestBody StockReservationRequest request);

    @PutMapping("/stock/release")
    void releaseStock(@RequestBody StockReleaseRequest request);
}
```

**Why:** Yeh interface ek bridge hai — tum method call karo, Feign HTTP request internally handle karta hai. Koi implementation likhne ki zarurat nahi.

---

### Step 5 — StockReservationRequest.java (DTO)
```java
@Data @Builder
public class StockReservationRequest {
    private List<StockItem> items;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StockItem {
        private Long productId;
        private Integer quantity;
    }
}
```

**Why:** Feign ko ek structured request body chahiye — yeh DTO Inventory Service ko batata hai ki kaunse products ki kitni quantity chahiye.

---

### Step 6 — StockReservationResponse.java (DTO)
```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StockReservationResponse {
    private boolean success;
    private String message;
}
```

**Why:** Inventory Service ka response capture karne ke liye — `success: true/false` se Order Service decide karta hai ki order confirm karna hai ya reject.

---

### Step 7 — StockController.java (Inventory Service)
```java
@PostMapping("/reserve-bulk")
public StockReservationResponse reserveStockBulk(@RequestBody StockReservationRequest request) {
    return stockService.reserveStockBulk(request);
}
```

**Why:** Feign `POST /stock/reserve-bulk` call karta hai — Inventory Service ke paas yeh endpoint hona zaroori hai. Bina iske 404 error aata.

---

### Step 8 — StockServiceImpl.java (Inventory Service)
Two-phase validation + reservation:

```java
@Transactional
public StockReservationResponse reserveStockBulk(StockReservationRequest request) {

    // Loop 1 — Validate ALL items first (no DB changes)
    for (StockItem item : request.getItems()) {
        int available = stock.getQuantity() - stock.getReservedQuantity();
        if (available < item.getQuantity()) {
            throw new RuntimeException("Insufficient stock for product: " + item.getProductId());
        }
    }

    // Loop 2 — Reserve ALL items (only if all are valid)
    for (StockItem item : request.getItems()) {
        stock.setReservedQuantity(stock.getReservedQuantity() + item.getQuantity());
        stockRepository.save(stock);
    }

    return StockReservationResponse.builder().success(true).build();
}
```

**Why two loops?** Atomic operation ensure karne ke liye.
- Agar sirf ek loop hota: Item A reserve ✅ → Item B reserve ✅ → Item C fail ❌ → A aur B already reserved (data inconsistency!)
- Do loops: Pehle sab validate, tab hi reserve — ya sab hoga ya kuch nahi `@Transactional` ke saath.

---

### Step 9 — OrderService.java (Order Service)
```java
// Build request
StockReservationRequest stockRequest = StockReservationRequest.builder()
        .items(/* order items mapped */)
        .build();

// Feign call
StockReservationResponse stockResponse = inventoryFeignClient.reserveStockBulk(stockRequest);

// Decision
if (!stockResponse.isSuccess()) {
    throw new RuntimeException(stockResponse.getMessage());
}

// Save order as CONFIRMED
order.setStatus(OrderStatus.CONFIRMED);
orderRepository.save(order);
```

**Why:** Yahan Feign actually use hota hai — stock confirm ho toh order save, nahi toh reject.

---

## Complete Flow

```
Customer places order
    ↓
OrderController → OrderService
    ↓
StockReservationRequest banao
    ↓
inventoryFeignClient.reserveStockBulk()   ← Feign call
    ↓ HTTP POST to localhost:8086/stock/reserve-bulk
StockController (Inventory Service)
    ↓
StockServiceImpl
    ↓
Loop 1 → Validate ALL items
    ↓ (any fail → exception → order rejected ❌)
Loop 2 → Reserve ALL items ✅
    ↓
StockReservationResponse { success: true }
    ↓
Order Service receives response
    ↓
Order CONFIRMED → saved to DB ✅
    ↓
Kafka event → Delivery + Notification
```

---

## Interview Answer

**"Feign kyun use kiya Delivery ke liye nahi?"**

> "Stock confirmation ek critical synchronous operation hai — customer ko turant confirm karna padta hai. Isliye Feign use kiya. Delivery aur Notification non-critical hain — partner baad mein bhi assign ho sakta hai — isliye woh Kafka se async handle hote hain. Yeh 'Check first, then commit' principle hai."

---

## Files Changed/Created

| File | Service | Action |
|---|---|---|
| `pom.xml` | Order | Modified — added Feign dependency |
| `OrderServiceApplication.java` | Order | Modified — added `@EnableFeignClients` |
| `application.properties` | Order | Modified — added inventory URL |
| `InventoryFeignClient.java` | Order | **Created** — Feign interface |
| `StockReservationRequest.java` | Order | **Created** — request DTO |
| `StockReservationResponse.java` | Order | **Created** — response DTO |
| `StockController.java` | Inventory | Modified — added `/reserve-bulk` endpoint |
| `StockServiceImpl.java` | Inventory | Modified — added `reserveStockBulk()` |
| `OrderService.java` | Order | Modified — Feign call in `createOrder()` |
