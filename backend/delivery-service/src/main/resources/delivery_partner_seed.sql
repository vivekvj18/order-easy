-- ═══════════════════════════════════════════════════════════════════════════
-- Delivery Partner Seed Data — OrderEasy Delivery Service
--
-- Dark store reference (from Inventory Service seed):
--   Store 2 (Neeladri Nagar):     12.8508, 77.6534  ← typical selected store
--   Store 1 (IIITB Gate):          12.8452, 77.6632
--   Store 3 (Electronic City Ph2): 12.8336, 77.6800
--
-- Scenario:
--   Partner 1 (Arjun): ~2 km from Neeladri Nagar store → within PRIMARY radius (5 km) ✅
--   Partner 2 (Priya): ~1.5 km from Neeladri Nagar store → within PRIMARY radius (5 km) ✅ [nearest]
--   Partner 3 (Rahul): ~7 km from Neeladri Nagar store → only within FALLBACK radius (10 km)
--   Partner 4 (Sana):  ~3 km from Electronic City Ph2 store → PRIMARY radius for Store 3
--
-- Run manually if delivery_partners table is empty.
-- Since ddl-auto=update, the table will be auto-created on service start.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO delivery_partners
    (id, name, phone, email, status, created_at, auth_user_id, latitude, longitude)
VALUES
-- Partner 1: Near Neeladri Nagar dark store (~2 km) — within PRIMARY radius
(1, 'Arjun Kumar',   '9876541001', 'arjun@ordereasy.com',  'AVAILABLE', NOW(), NULL, 12.8490, 77.6350),

-- Partner 2: Closest to Neeladri Nagar store (~1.5 km) — should be SELECTED for Store 2 orders
(2, 'Priya Sharma',  '9876541002', 'priya@ordereasy.com',  'AVAILABLE', NOW(), NULL, 12.8520, 77.6420),

-- Partner 3: Farther away (~7 km from Neeladri Nagar) — only reachable via FALLBACK radius
(3, 'Rahul Singh',   '9876541003', 'rahul@ordereasy.com',  'AVAILABLE', NOW(), NULL, 12.8950, 77.6100),

-- Partner 4: Near Electronic City Phase 2 dark store (~2 km) — preferred for Store 3 orders
(4, 'Sana Khan',     '9876541004', 'sana@ordereasy.com',   'AVAILABLE', NOW(), NULL, 12.8280, 77.6750),

-- Partner 5: Near IIITB Gate dark store (~0.5 km) — preferred for Store 1 orders
(5, 'Vikram Patel',  '9876541005', 'vikram@ordereasy.com', 'AVAILABLE', NOW(), NULL, 12.8460, 77.6620);
