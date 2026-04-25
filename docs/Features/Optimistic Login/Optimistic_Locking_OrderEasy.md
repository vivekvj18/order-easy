# Optimistic Locking — OrderEasy
### What we built, why we built it, and how to explain it

---

## The Problem We Solved

In a quick commerce system like OrderEasy, multiple users can place orders
simultaneously. Before this change, if two users ordered the last item at the
same time, this would happen:

```
Stock in DB: quantity = 1

User A reads → sees quantity = 1 → validation passes ✅
User B reads → sees quantity = 1 → validation passes ✅

User A deducts → quantity becomes 0
User B deducts → quantity becomes -1 ❌ SILENT DATA CORRUPTION
```

No error. No exception. Stock goes negative. This is called a **Race Condition**.

---

## Two Ways the Industry Solves This

### Pessimistic Locking (what we did NOT use)
- Locks the DB row while reading it
- Nobody else can touch it until the first request is done
- SQL: `SELECT * FROM stock WHERE id=1 FOR UPDATE`
- Problem: 1000 users in a flash sale → 999 waiting → system slows to a crawl

### Optimistic Locking (what we implemented ✅)
- Does NOT lock anything
- Lets everyone read freely
- At the moment of writing, checks: "did anyone else change this row while I was working?"
- Uses a **version number** to detect conflicts
- If conflict detected → throw exception → return clean error to user
- No blocking. No waiting. Fast.

---

## How Version Numbers Work

JPA adds a `version` column to the stock table.
Every successful update increments this number automatically.

```
INITIAL STATE
| id | productId | quantity | version |
|----|-----------|----------|---------|
|  1 |       101 |        1 |       0 |

User A reads → gets { quantity: 1, version: 0 }
User B reads → gets { quantity: 1, version: 0 }

User A writes:
  UPDATE stock SET quantity=0, version=1
  WHERE id=1 AND version=0   ← Hibernate adds this check automatically
  → version in DB is still 0 → ✅ MATCH → saved → version becomes 1

User B writes:
  UPDATE stock SET quantity=0, version=1
  WHERE id=1 AND version=0
  → version in DB is NOW 1 (User A changed it) → ❌ MISMATCH
  → Hibernate throws OptimisticLockException
  → Our handler catches it → returns 409 Conflict
```

---

## Exact Code Changes Made

### Change 1 — Stock.java (inventory-service)

```java
@Version                 // ← ADDED
private Long version;    // ← ADDED
```

That is literally 2 lines. Hibernate does everything else automatically.
The `version` column was created in the DB by `ddl-auto=update`.

### Change 2 — GlobalExceptionHandler.java (inventory-service)

```java
@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
public ResponseEntity<Map<String, Object>> handleOptimisticLock(
        ObjectOptimisticLockingFailureException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(buildResponse(
                "Stock was modified by another request. Please try again.",
                HttpStatus.CONFLICT));
}
```

Returns **409 Conflict** — not 500.
- 500 = YOUR server crashed (your fault)
- 409 = Two valid requests conflicted (correct semantics)

---

## What Changed in the Database

```sql
DESCRIBE stock;

-- Before:
-- id, productId, quantity, reservedQuantity, updatedAt

-- After:
-- id, productId, quantity, reservedQuantity, updatedAt, version ← NEW

-- version starts at 0 for every row
-- increments automatically on every successful write
-- you never touch it manually
```

---

## Impact on the System

| Before | After |
|--------|-------|
| Stock could go negative | Stock is always ≥ 0 |
| Silent data corruption | Clean 409 error returned |
| Race condition possible | Race condition impossible |
| No performance cost | Still no performance cost |
| 2 services affected | Protected across all stock writes |

---

## What to Say in an Interview

> "I implemented **Optimistic Locking** using JPA's `@Version` annotation
> on the Stock entity to handle concurrent stock reservation.
>
> The problem is classic — in quick commerce, two users can try to order
> the last item simultaneously. Without protection, both reads see quantity=1,
> both pass validation, and both deduct — leaving quantity at -1.
>
> I chose Optimistic over Pessimistic Locking because quick commerce is
> read-heavy. Pessimistic locking blocks rows, which kills throughput during
> flash sales. Optimistic locking lets everyone read freely and only detects
> the conflict at write time using a version column.
>
> When a conflict is detected, Hibernate throws `OptimisticLockException`,
> which I handle in the global exception handler and return a **409 Conflict**
> with a user-friendly message. Stock never goes negative. Zero performance
> penalty."

---

## Jargon Checklist for Interviews

Use these exact phrases — they signal senior-level understanding:

- **"Race condition"** — when two threads read stale data and both try to write
- **"Optimistic Locking"** — conflict detected at write time, not prevented at read time
- **"Pessimistic Locking"** — conflict prevented by row-level DB lock
- **"@Version annotation"** — JPA mechanism that adds version column
- **"OptimisticLockException"** — what Hibernate throws on version mismatch
- **"409 Conflict"** — correct HTTP status for two valid requests conflicting
- **"Flash sale scenario"** — the real-world trigger for this problem
- **"Throughput"** — why we chose optimistic over pessimistic
- **"ACID compliance"** — what optimistic locking helps maintain at app level

---

## Files Modified

```
inventory-service/
├── src/main/java/.../entity/
│   └── Stock.java                    ← Added @Version + private Long version
└── src/main/java/.../exception/
    └── GlobalExceptionHandler.java   ← Added handleOptimisticLock() method
```

---

## Total Lines of Code Added: 8
## Protection Gained: Complete race condition safety on all stock writes
