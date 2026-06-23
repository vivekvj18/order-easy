-- ═══════════════════════════════════════════════════════════════════════════
-- Dark Store Seed Data — OrderEasy Inventory Service
--
-- Demo Scenario (IIIT Bangalore area):
--   User at IIITB (~12.8452, 77.6632) orders Milk (productId=1) + Bread (productId=2).
--   Store 1 (IIITB Gate) is nearest but has Bread qty=0 → SKIPPED.
--   Store 2 (Neeladri Nagar) has both → SELECTED.
--   System reserves stock from Store 2 only (no partial order, no multi-store split).
--
-- Run this SQL manually via MySQL CLI or DBeaver if needed after service startup.
-- Since ddl-auto=update, tables will be auto-created by Hibernate on first boot.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Step 1: Dark Stores ───────────────────────────────────────────────────
-- Run only if dark_stores table is empty

INSERT INTO dark_stores (id, name, latitude, longitude, active, created_at, updated_at)
VALUES
(1, 'IIITB Gate Dark Store',                12.8452, 77.6632, true, NOW(), NOW()),
(2, 'Neeladri Nagar Dark Store',            12.8508, 77.6534, true, NOW(), NOW()),
(3, 'Electronic City Phase 2 Dark Store',   12.8336, 77.6800, true, NOW(), NOW()),
(4, 'Hosa Road Dark Store',                 12.8706, 77.6462, true, NOW(), NOW()),
(5, 'Bommasandra Dark Store',               12.8168, 77.6901, true, NOW(), NOW());

-- ── Step 2: Stock Rows (per dark store, per product) ─────────────────────
--
-- Product IDs reference the global Product Service catalog.
-- Adjust productIds below if your Product Service seeds different IDs.
-- Typical Product Service seed: Milk=1, Bread=2, Eggs=3 (verify from Product DB).
--
-- Demo story:
--   Store 1: Bread (productId=2) qty=0  → cannot fulfill cart with Bread
--   Store 2: All items available        → selected as fulfillment store
--   Stores 3-5: fully stocked as backup

INSERT INTO stock (id, dark_store_id, product_id, quantity, reserved_quantity, version, updated_at)
VALUES
-- Store 1: IIITB Gate — nearest but no Bread (qty=0 for productId=2)
(1,  1, 1, 20, 0, 0, NOW()),
(2,  1, 2,  0, 0, 0, NOW()),   -- Bread = 0 (intentionally depleted for demo)
(3,  1, 3, 10, 0, 0, NOW()),

-- Store 2: Neeladri Nagar — fully stocked, fulfillable fallback
(4,  2, 1, 30, 0, 0, NOW()),
(5,  2, 2, 25, 0, 0, NOW()),
(6,  2, 3, 15, 0, 0, NOW()),

-- Store 3: Electronic City Phase 2
(7,  3, 1, 40, 0, 0, NOW()),
(8,  3, 2, 20, 0, 0, NOW()),
(9,  3, 3, 20, 0, 0, NOW()),

-- Store 4: Hosa Road
(10, 4, 1, 25, 0, 0, NOW()),
(11, 4, 2, 30, 0, 0, NOW()),
(12, 4, 3,  5, 0, 0, NOW()),

-- Store 5: Bommasandra
(13, 5, 1, 50, 0, 0, NOW()),
(14, 5, 2, 40, 0, 0, NOW()),
(15, 5, 3, 30, 0, 0, NOW());
