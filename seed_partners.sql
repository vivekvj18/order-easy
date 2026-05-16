-- SEEDING AUTH USERS
USE ordereasy_auth_db;

-- BCrypt hash for 'password' is '$2a$10$8.UnVuG9HHgffUDAlk8q7uy5XeUCo0KN5VpSLat38YzJPKuL7uSxy'
INSERT INTO users (email, password, role, phone_number) VALUES
('rider1@ordereasy.com', '$2a$10$8.UnVuG9HHgffUDAlk8q7uy5XeUCo0KN5VpSLat38YzJPKuL7uSxy', 'DELIVERY_PARTNER', '9000000001'),
('rider2@ordereasy.com', '$2a$10$8.UnVuG9HHgffUDAlk8q7uy5XeUCo0KN5VpSLat38YzJPKuL7uSxy', 'DELIVERY_PARTNER', '9000000002');


-- SEEDING DELIVERY PARTNERS
USE ordereasy_delivery_db;

INSERT INTO delivery_partners (name, phone, email, status, created_at, latitude, longitude) VALUES
('Rahul Rider', '9000000001', 'rider1@ordereasy.com', 'AVAILABLE', NOW(), 12.9716, 77.5946),
('Amit Delivery', '9000000002', 'rider2@ordereasy.com', 'AVAILABLE', NOW(), 12.9352, 77.6245);
