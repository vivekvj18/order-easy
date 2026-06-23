# Dark Store Fulfillment — Test Guide

## Architecture Summary

Dark store addition does **not** change the core two-phase reservation logic.
It adds a **store-selection layer (Phase 0)** before reservation. Once the nearest
fulfillable dark store is selected, the same validation-first and reserve-later logic
runs at `(darkStoreId + productId)` level.

```
Checkout Request
      │
      ▼
Phase 0 — Dark Store Selection (NEW)
  1. Compute bounding box (5km radius) around user location
  2. Query active stores within box
  3. Sort by Haversine distance (nearest first)
  4. Find first store that can fulfill ALL cart items
  5. If none in 5km, retry with 10km fallback
      │
      ▼
Phase 1 — Validate (unchanged conceptually)
  Validate all items exist in selected dark store
  Check availableStock = quantity - reservedQuantity >= requested
      │
      ▼
Phase 2 — Reserve (unchanged conceptually)
  Increment reservedQuantity for all items in selected dark store
      │
      ▼
Return: { success, darkStoreId, darkStoreName, darkStoreLatitude, darkStoreLongitude }
```

---

## Step 1: Start Services

Start in this order:
```bash
cd backend/discovery-server && mvn spring-boot:run
cd backend/api-gateway && mvn spring-boot:run
cd backend/inventory-service && mvn spring-boot:run
cd backend/order-service && mvn spring-boot:run
cd backend/payment-service && mvn spring-boot:run
```

---

## Step 2: Seed Dark Stores and Stock

Run from `inventory-service/src/main/resources/dark_store_seed.sql`:
```bash
mysql -u spring_user -p ordereasy_inventory_db < backend/inventory-service/src/main/resources/dark_store_seed.sql
```

Verify:
```
GET http://localhost:8086/dark-stores
GET http://localhost:8086/inventory/analytics/stock-summary
```

---

## Step 3: Verify Store 1 Has Bread=0

```
GET http://localhost:8086/stock/1/2
```
Expected: quantity=0, availableQuantity=0

---

## Step 4: Checkout Near IIITB

```http
POST http://localhost:8080/api/orders
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "userId": 1,
  "userEmail": "user@test.com",
  "deliveryAddress": "IIIT Bangalore",
  "deliveryLatitude": 12.8452,
  "deliveryLongitude": 77.6632,
  "deliverySlot": "EVENING",
  "totalAmount": 150.00,
  "items": [
    { "productId": 1, "quantity": 2, "price": 50.0 },
    { "productId": 2, "quantity": 1, "price": 50.0 }
  ]
}
```

---

## Step 5: Confirm Store 1 Skipped in Logs

```
[DarkStore] Checking store: id=1, name='IIITB Gate Dark Store', distance=0.00km
[DarkStore] Store 'IIITB Gate Dark Store' cannot fulfill complete cart. Skipping to next.
[DarkStore] Checking store: id=2, name='Neeladri Nagar Dark Store', distance=1.13km
[DarkStore] Store 'Neeladri Nagar Dark Store' (1.13km) can fulfill complete cart. Selected.
```

---

## Step 6: Confirm Order Has DarkStore Details

Response must contain:
```json
{
  "darkStoreId": 2,
  "darkStoreName": "Neeladri Nagar Dark Store",
  "darkStoreLatitude": 12.8508,
  "darkStoreLongitude": 77.6534
}
```

---

## Step 7: Verify Stock Reserved in Store 2 Only

```
GET http://localhost:8086/stock/2/1  → reservedQuantity: 2
GET http://localhost:8086/stock/2/2  → reservedQuantity: 1
GET http://localhost:8086/stock/1/2  → reservedQuantity: 0  (Store 1 untouched)
```

---

## Step 8: Trigger Payment

```http
POST http://localhost:8080/api/payments
Authorization: Bearer <TOKEN>
X-Idempotency-Key: test-key-001
Content-Type: application/json

{
  "orderId": 1,
  "userId": 1,
  "userEmail": "user@test.com",
  "amount": 150.00
}
```

---

## Step 9: Confirm Finalization in Store 2

```
GET http://localhost:8086/stock/2/1  → quantity: 28, reservedQuantity: 0
GET http://localhost:8086/stock/2/2  → quantity: 24, reservedQuantity: 0
```

Inventory logs:
```
[Stock Finalization] darkStore=2, productId=1 | qty: 30 → 28 | reserved: 2 → 0
[Stock Finalization] darkStore=2, productId=2 | qty: 25 → 24 | reserved: 1 → 0
```

---

## Step 10: Duplicate payment-completed Test

Re-send same payment request with same idempotency key.

Expected log:
```
[Stock Finalization] Duplicate event for orderId=1. Already finalized — skipping.
```

Stock must NOT change.

---

## Step 11: Cancel Order — Stock Release

Cancel order via `DELETE /api/orders/{orderId}`.

`order-cancelled` event carries `darkStoreId=2`.
Inventory Service releases reserved stock only from Store 2.

---

## Interview Notes

| Concept | Code Location |
|---------|---------------|
| Nearest = nearest FULFILLABLE | `StockServiceImpl.selectNearestFulfillableStore()` |
| Phase 0 = dark store selection (new) | `StockServiceImpl.reserveStockBulk()` |
| Two-phase reservation unchanged | Phase 1 + Phase 2 in `StockServiceImpl` |
| Stock at (darkStoreId + productId) | `StockRepository` + `Stock` entity |
| Product catalog = Product Service | `Stock` only stores `productId`, no name/price |
| No partial orders | `canFulfillCompleteCart()` — all-or-nothing |
| Redis GEO not used | `HaversineUtil` Javadoc |
| Idempotency | `FinalizedOrder` entity |

---

## Migration Note

> **If you have existing stock rows** without `dark_store_id`, run:
> ```sql
> -- Dev/demo reset (drop and reseed)
> DROP TABLE IF EXISTS stock;
> -- Then restart Inventory Service and run dark_store_seed.sql
> ```
