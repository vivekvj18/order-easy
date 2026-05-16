-- SEEDING CATALOG DATABASE
USE ordereasy_product_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO products (id, name, category, price, description, created_at) VALUES
(1, 'Fresh Bananas (6 pcs)', 'Fruits & Vegetables', 49.0, 'Sweet Cavendish bananas', NOW()),
(2, 'Whole Milk 1L', 'Dairy & Eggs', 68.0, 'Full cream pasteurized milk', NOW()),
(3, 'Amul Butter 100g', 'Dairy & Eggs', 55.0, 'Salted table butter', NOW()),
(4, 'Aashirvaad Atta 5kg', 'Grocery', 260.0, 'Whole wheat flour', NOW()),
(5, 'Lays Classic Salted', 'Snacks', 20.0, 'Crispy potato chips', NOW()),
(6, 'Tropicana Orange 1L', 'Beverages', 110.0, '100% pure juice', NOW()),
(7, 'Brown Eggs (6 pack)', 'Dairy & Eggs', 72.0, 'Free range farm eggs', NOW()),
(8, 'Britannia Bread', 'Bakery', 44.0, 'Soft whole wheat loaf', NOW()),
(9, 'Red Apples (4 pcs)', 'Fruits & Vegetables', 120.0, 'Crispy Royal Gala apples', NOW()),
(10, 'Fresh Paneer 200g', 'Dairy & Eggs', 95.0, 'Soft and fresh malai paneer', NOW()),
(11, 'Greek Yogurt Blueberry', 'Dairy & Eggs', 45.0, 'High protein creamy yogurt', NOW()),
(12, 'Alphonso Mangoes (2 pcs)', 'Fruits & Vegetables', 240.0, 'Premium Ratnagiri Alphonsos', NOW()),
(13, 'Potato (1kg)', 'Fruits & Vegetables', 35.0, 'Fresh organic potatoes', NOW()),
(14, 'Onion (1kg)', 'Fruits & Vegetables', 40.0, 'Pink onions from Nasik', NOW()),
(15, 'Colgate Strong Teeth', 'Personal Care', 92.0, 'Calcium-boosted toothpaste', NOW()),
(16, 'Dettol Handwash Refill', 'Personal Care', 105.0, 'Original germ protection', NOW());


-- SEEDING INVENTORY DATABASE
USE ordereasy_inventory_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE stock;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO products (id, name, category, price, description, created_at) VALUES
(1, 'Fresh Bananas (6 pcs)', 'Fruits & Vegetables', 49.0, 'Sweet Cavendish bananas', NOW()),
(2, 'Whole Milk 1L', 'Dairy & Eggs', 68.0, 'Full cream pasteurized milk', NOW()),
(3, 'Amul Butter 100g', 'Dairy & Eggs', 55.0, 'Salted table butter', NOW()),
(4, 'Aashirvaad Atta 5kg', 'Grocery', 260.0, 'Whole wheat flour', NOW()),
(5, 'Lays Classic Salted', 'Snacks', 20.0, 'Crispy potato chips', NOW()),
(6, 'Tropicana Orange 1L', 'Beverages', 110.0, '100% pure juice', NOW()),
(7, 'Brown Eggs (6 pack)', 'Dairy & Eggs', 72.0, 'Free range farm eggs', NOW()),
(8, 'Britannia Bread', 'Bakery', 44.0, 'Soft whole wheat loaf', NOW()),
(9, 'Red Apples (4 pcs)', 'Fruits & Vegetables', 120.0, 'Crispy Royal Gala apples', NOW()),
(10, 'Fresh Paneer 200g', 'Dairy & Eggs', 95.0, 'Soft and fresh malai paneer', NOW()),
(11, 'Greek Yogurt Blueberry', 'Dairy & Eggs', 45.0, 'High protein creamy yogurt', NOW()),
(12, 'Alphonso Mangoes (2 pcs)', 'Fruits & Vegetables', 240.0, 'Premium Ratnagiri Alphonsos', NOW()),
(13, 'Potato (1kg)', 'Fruits & Vegetables', 35.0, 'Fresh organic potatoes', NOW()),
(14, 'Onion (1kg)', 'Fruits & Vegetables', 40.0, 'Pink onions from Nasik', NOW()),
(15, 'Colgate Strong Teeth', 'Personal Care', 92.0, 'Calcium-boosted toothpaste', NOW()),
(16, 'Dettol Handwash Refill', 'Personal Care', 105.0, 'Original germ protection', NOW());

INSERT INTO stock (product_id, quantity, reserved_quantity, updated_at, version) VALUES
(1, 100, 0, NOW(), 0),
(2, 100, 0, NOW(), 0),
(3, 100, 0, NOW(), 0),
(4, 100, 0, NOW(), 0),
(5, 100, 0, NOW(), 0),
(6, 100, 0, NOW(), 0),
(7, 100, 0, NOW(), 0),
(8, 100, 0, NOW(), 0),
(9, 100, 0, NOW(), 0),
(10, 100, 0, NOW(), 0),
(11, 100, 0, NOW(), 0),
(12, 100, 0, NOW(), 0),
(13, 100, 0, NOW(), 0),
(14, 100, 0, NOW(), 0),
(15, 100, 0, NOW(), 0),
(16, 100, 0, NOW(), 0);
