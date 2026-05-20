-- SEEDING AUTH USERS
USE ordereasy_auth_db;

-- BCrypt hash for password: password
SET @rider_password = '$2a$10$2gZOC.2pX7KYivzSk6LraeUw8YpF3srxbvLRal.vFQLnDA2r7BYoO';

DELETE FROM users
WHERE email IN (
  'rider1@ordereasy.com',
  'rider2@ordereasy.com',
  'rider3@ordereasy.com',
  'rider4@ordereasy.com',
  'rider5@ordereasy.com',
  'rider6@ordereasy.com',
  'rider7@ordereasy.com',
  'rider8@ordereasy.com',
  'rider9@ordereasy.com',
  'rider10@ordereasy.com'
)
OR phone_number IN (
  '9000000001',
  '9000000002',
  '9000000003',
  '9000000004',
  '9000000005',
  '9000000006',
  '9000000007',
  '9000000008',
  '9000000009',
  '9000000010'
);

INSERT INTO users (email, password, role, phone_number) VALUES
('rider1@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000001'),
('rider2@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000002'),
('rider3@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000003'),
('rider4@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000004'),
('rider5@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000005'),
('rider6@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000006'),
('rider7@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000007'),
('rider8@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000008'),
('rider9@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000009'),
('rider10@ordereasy.com', @rider_password, 'DELIVERY_PARTNER', '9000000010')
ON DUPLICATE KEY UPDATE
password = VALUES(password),
role = VALUES(role),
phone_number = VALUES(phone_number);

-- SEEDING DELIVERY PARTNERS ACROSS BANGALORE
USE ordereasy_delivery_db;

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Rahul Rider', '9000000001', 'rider1@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider1@ordereasy.com'), 12.9766, 77.5713
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider1@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Amit Delivery', '9000000002', 'rider2@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider2@ordereasy.com'), 12.9784, 77.6408
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider2@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Sneha Express', '9000000003', 'rider3@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider3@ordereasy.com'), 12.9352, 77.6245
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider3@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Kiran Logistics', '9000000004', 'rider4@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider4@ordereasy.com'), 12.9116, 77.6389
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider4@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Priya FastDrop', '9000000005', 'rider5@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider5@ordereasy.com'), 12.9698, 77.7500
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider5@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Naveen Runner', '9000000006', 'rider6@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider6@ordereasy.com'), 12.9569, 77.7011
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider6@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Meera Courier', '9000000007', 'rider7@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider7@ordereasy.com'), 12.8452, 77.6602
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider7@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Arjun Wheels', '9000000008', 'rider8@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider8@ordereasy.com'), 12.9250, 77.5938
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider8@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Farhan Route', '9000000009', 'rider9@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider9@ordereasy.com'), 13.0358, 77.5970
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider9@ordereasy.com');

INSERT INTO delivery_partners (name, phone, email, status, created_at, auth_user_id, latitude, longitude)
SELECT 'Divya NorthDrop', '9000000010', 'rider10@ordereasy.com', 'AVAILABLE', NOW(),
       (SELECT id FROM ordereasy_auth_db.users WHERE email = 'rider10@ordereasy.com'), 13.1007, 77.5963
WHERE NOT EXISTS (SELECT 1 FROM delivery_partners WHERE email = 'rider10@ordereasy.com');

UPDATE delivery_partners p
JOIN ordereasy_auth_db.users u ON u.email = p.email
SET p.auth_user_id = u.id,
    p.status = CASE WHEN p.status IS NULL THEN 'AVAILABLE' ELSE p.status END
WHERE p.email LIKE 'rider%@ordereasy.com';
