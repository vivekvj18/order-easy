-- ═══════════════════════════════════════════════════════════════════════════
-- Dark Store Seed Data — OrderEasy Inventory Service
-- Auto-executed by Spring Boot on startup via:
--   spring.sql.init.data-locations=classpath:data.sql
--   spring.sql.init.mode=always
--   spring.jpa.defer-datasource-initialization=true
--
-- INSERT IGNORE is used so this script is safe to re-run on every restart.
-- It only inserts rows if they don't already exist (idempotent).
--
-- Demo Scenario (IIIT Bangalore area):
--   User at IIITB (~12.8452, 77.6632) orders Milk (productId=1) + Bread (productId=2).
--   Store 1 (IIITB Gate) is nearest but has Bread qty=0  → SKIPPED by dark store selection.
--   Store 2 (Neeladri Nagar) has all items available     → SELECTED.
--   System reserves stock from Store 2 only.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Dark Stores ───────────────────────────────────────────────────────────
INSERT IGNORE INTO dark_stores (id, name, latitude, longitude, active, created_at, updated_at)
VALUES
(1, 'IIITB Gate Dark Store',                12.8452, 77.6632, true, NOW(), NOW()),
(2, 'Neeladri Nagar Dark Store',            12.8508, 77.6534, true, NOW(), NOW()),
(3, 'Electronic City Phase 2 Dark Store',   12.8336, 77.6800, true, NOW(), NOW()),
(4, 'Hosa Road Dark Store',                 12.8706, 77.6462, true, NOW(), NOW()),
(5, 'Bommasandra Dark Store',               12.8168, 77.6901, true, NOW(), NOW());

-- ── Stock Rows (per dark store, per product) ──────────────────────────────
-- Product IDs reference the global Product Service catalog.
-- Verify productIds from Product Service DB before running.
-- Assumed mapping: productId=1 (Milk), productId=2 (Bread), productId=3 (Eggs)
--
-- KEY DEMO: Store 1 has Bread (productId=2) qty=0
--   → canFulfillCompleteCart() returns false for Store 1
--   → system skips Store 1 and selects Store 2 (Neeladri Nagar)

INSERT IGNORE INTO stock (id, dark_store_id, product_id, quantity, reserved_quantity, version, updated_at)
VALUES
-- Store 1: IIITB Gate — nearest but no Bread
(1,  1, 1, 20, 0, 0, NOW()),
(2,  1, 2,  0, 0, 0, NOW()),   -- Bread = 0 → store 1 will be skipped in demo
(3,  1, 3, 10, 0, 0, NOW()),

-- Store 2: Neeladri Nagar — fully stocked (selected in demo)
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
