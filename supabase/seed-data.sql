
-- Brill Prime Database Seed Data
-- This script populates the database with sample data for testing

-- Clear existing data (be careful in production!)
TRUNCATE users, merchants, products, orders, order_items, driver_locations, transactions CASCADE;

-- Insert Sample Users (Consumers, Merchants, Drivers)
INSERT INTO users (id, email, full_name, phone, role, created_at, is_verified) VALUES
-- Consumers
('consumer-1', 'john.doe@example.com', 'John Doe', '+2348012345678', 'consumer', NOW(), true),
('consumer-2', 'jane.smith@example.com', 'Jane Smith', '+2348012345679', 'consumer', NOW(), true),
('consumer-3', 'mike.jones@example.com', 'Mike Jones', '+2348012345680', 'consumer', NOW(), true),

-- Merchants
('merchant-1', 'quickmart@example.com', 'QuickMart Store', '+2348012345681', 'merchant', NOW(), true),
('merchant-2', 'freshfarms@example.com', 'Fresh Farms Market', '+2348012345682', 'merchant', NOW(), true),
('merchant-3', 'techstore@example.com', 'Tech Store Lagos', '+2348012345683', 'merchant', NOW(), true),
('merchant-4', 'foodcourt@example.com', 'Food Court Express', '+2348012345684', 'merchant', NOW(), true),
('merchant-5', 'pharmacy@example.com', 'HealthPlus Pharmacy', '+2348012345685', 'merchant', NOW(), true),

-- Drivers
('driver-1', 'driver1@example.com', 'Abdul Mohammed', '+2348012345686', 'driver', NOW(), true),
('driver-2', 'driver2@example.com', 'Chioma Okafor', '+2348012345687', 'driver', NOW(), true),
('driver-3', 'driver3@example.com', 'Emeka Nwankwo', '+2348012345688', 'driver', NOW(), true);

-- Insert Merchants with Locations
INSERT INTO merchants (id, user_id, business_name, description, address, latitude, longitude, category, rating, is_verified, created_at) VALUES
('merch-1', 'merchant-1', 'QuickMart Store', 'Your one-stop shop for groceries and essentials', '123 Lagos Road, Victoria Island, Lagos', 6.4281, 3.4219, 'grocery', 4.5, true, NOW()),
('merch-2', 'merchant-2', 'Fresh Farms Market', 'Fresh organic produce and farm products', '45 Farm Road, Lekki, Lagos', 6.4474, 3.4700, 'grocery', 4.8, true, NOW()),
('merch-3', 'merchant-3', 'Tech Store Lagos', 'Latest electronics and gadgets', '78 Tech Plaza, Ikeja, Lagos', 6.6018, 3.3515, 'electronics', 4.6, true, NOW()),
('merch-4', 'merchant-4', 'Food Court Express', 'Delicious meals delivered fast', '12 Food Street, Surulere, Lagos', 6.4969, 3.3614, 'restaurant', 4.7, true, NOW()),
('merch-5', 'merchant-5', 'HealthPlus Pharmacy', 'Quality medicines and healthcare products', '56 Health Avenue, Yaba, Lagos', 6.5158, 3.3782, 'pharmacy', 4.9, true, NOW());

-- Insert Sample Products/Commodities
INSERT INTO products (id, merchant_id, name, description, price, category, stock_quantity, image_url, is_available, created_at) VALUES
-- QuickMart Products
('prod-1', 'merch-1', 'Rice (50kg)', 'Premium long grain rice', 45000, 'grocery', 100, 'https://images.unsplash.com/photo-1586201375761-83865001e31c', true, NOW()),
('prod-2', 'merch-1', 'Vegetable Oil (5L)', 'Pure vegetable cooking oil', 8500, 'grocery', 50, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', true, NOW()),
('prod-3', 'merch-1', 'Sugar (2kg)', 'Refined white sugar', 2500, 'grocery', 80, 'https://images.unsplash.com/photo-1514594869928-e96f1e8cc715', true, NOW()),

-- Fresh Farms Products
('prod-4', 'merch-2', 'Organic Tomatoes (1kg)', 'Fresh organic tomatoes', 1500, 'produce', 200, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337', true, NOW()),
('prod-5', 'merch-2', 'Fresh Vegetables Bundle', 'Assorted fresh vegetables', 3000, 'produce', 150, 'https://images.unsplash.com/photo-1540420773420-3366772f4999', true, NOW()),
('prod-6', 'merch-2', 'Organic Eggs (12 pack)', 'Farm fresh organic eggs', 2000, 'produce', 100, 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7', true, NOW()),

-- Tech Store Products
('prod-7', 'merch-3', 'Samsung Galaxy S23', 'Latest Samsung smartphone', 650000, 'electronics', 20, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c', true, NOW()),
('prod-8', 'merch-3', 'iPhone 15 Pro', 'Latest Apple iPhone', 1200000, 'electronics', 15, 'https://images.unsplash.com/photo-1592286927505-c8b01ed0ebb6', true, NOW()),
('prod-9', 'merch-3', 'Wireless Earbuds', 'Premium wireless earbuds', 45000, 'electronics', 50, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df', true, NOW()),

-- Food Court Products
('prod-10', 'merch-4', 'Jollof Rice Special', 'Delicious Nigerian jollof rice', 3500, 'food', 999, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0', true, NOW()),
('prod-11', 'merch-4', 'Chicken Shawarma', 'Grilled chicken shawarma wrap', 2500, 'food', 999, 'https://images.unsplash.com/photo-1626030424026-9c51a2f6d0e7', true, NOW()),
('prod-12', 'merch-4', 'Meat Pie', 'Freshly baked meat pie', 800, 'food', 999, 'https://images.unsplash.com/photo-1509440159596-0249088772ff', true, NOW()),

-- Pharmacy Products
('prod-13', 'merch-5', 'Paracetamol (500mg)', 'Pain relief tablets', 500, 'medicine', 200, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae', true, NOW()),
('prod-14', 'merch-5', 'Vitamin C (1000mg)', 'Immune support supplement', 3500, 'medicine', 100, 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2', true, NOW()),
('prod-15', 'merch-5', 'First Aid Kit', 'Complete first aid kit', 8500, 'medicine', 50, 'https://images.unsplash.com/photo-1603398938378-e54eab446dde', true, NOW());

-- Insert Sample Orders
INSERT INTO orders (id, user_id, merchant_id, driver_id, status, total_amount, delivery_address, delivery_latitude, delivery_longitude, created_at, estimated_delivery) VALUES
('order-1', 'consumer-1', 'merch-1', 'driver-1', 'DELIVERED', 56000, '10 Consumer Lane, VI, Lagos', 6.4281, 3.4250, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('order-2', 'consumer-2', 'merch-2', 'driver-2', 'IN_TRANSIT', 6500, '25 Lekki Road, Lekki, Lagos', 6.4474, 3.4800, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '30 minutes'),
('order-3', 'consumer-3', 'merch-4', NULL, 'CONFIRMED', 9300, '8 Surulere Street, Surulere, Lagos', 6.4969, 3.3700, NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '45 minutes'),
('order-4', 'consumer-1', 'merch-5', 'driver-3', 'PENDING', 12500, '10 Consumer Lane, VI, Lagos', 6.4281, 3.4250, NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '1 hour');

-- Insert Order Items
INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES
('order-1', 'prod-1', 1, 45000, 45000),
('order-1', 'prod-3', 4, 2500, 10000),
('order-1', 'prod-2', 1, 8500, 8500),

('order-2', 'prod-4', 2, 1500, 3000),
('order-2', 'prod-5', 1, 3000, 3000),
('order-2', 'prod-6', 1, 2000, 2000),

('order-3', 'prod-10', 2, 3500, 7000),
('order-3', 'prod-12', 3, 800, 2400),

('order-4', 'prod-13', 5, 500, 2500),
('order-4', 'prod-14', 2, 3500, 7000),
('order-4', 'prod-15', 1, 8500, 8500);

-- Insert Driver Locations (for real-time tracking)
INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, timestamp, is_active) VALUES
('driver-1', 6.4300, 3.4300, 10, NOW(), true),
('driver-2', 6.4500, 3.4750, 10, NOW(), true),
('driver-3', 6.5000, 3.3800, 10, NOW(), true);

-- Insert Sample Transactions
INSERT INTO transactions (id, user_id, order_id, amount, type, status, payment_method, created_at) VALUES
('txn-1', 'consumer-1', 'order-1', 56000, 'order_payment', 'completed', 'card', NOW() - INTERVAL '2 days'),
('txn-2', 'consumer-2', 'order-2', 6500, 'order_payment', 'pending', 'card', NOW() - INTERVAL '1 hour'),
('txn-3', 'consumer-3', 'order-3', 9300, 'order_payment', 'pending', 'transfer', NOW() - INTERVAL '10 minutes');

-- Update sequences to avoid conflicts
SELECT setval('users_id_seq', 100);
SELECT setval('merchants_id_seq', 100);
SELECT setval('products_id_seq', 100);
SELECT setval('orders_id_seq', 100);
SELECT setval('transactions_id_seq', 100);

-- Verify data
SELECT 'Users count:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Merchants count:', COUNT(*) FROM merchants
UNION ALL
SELECT 'Products count:', COUNT(*) FROM products
UNION ALL
SELECT 'Orders count:', COUNT(*) FROM orders
UNION ALL
SELECT 'Driver Locations:', COUNT(*) FROM driver_locations;
