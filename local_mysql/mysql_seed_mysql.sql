-- MySQL-compatible seed (converted subset). Review and expand as needed.
SET FOREIGN_KEY_CHECKS=0;

TRUNCATE TABLE order_items;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE driver_locations;
TRUNCATE TABLE products;
TRUNCATE TABLE merchants;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS=1;

-- Insert sample users
INSERT INTO users (id, firebase_uid, email, full_name, role, phone_number, is_verified, is_active, created_at)
VALUES
('user_001', NULL, 'john.consumer@test.com', 'John Doe', 'consumer', '+2348012345671', 1, 1, NOW()),
('user_002', NULL, 'jane.consumer@test.com', 'Jane Smith', 'consumer', '+2348012345672', 1, 1, NOW()),
('merch_001', NULL, 'shell.station@test.com', 'Shell Station', 'merchant', '+2348012345681', 1, 1, NOW()),
('driver_001', NULL, 'ade.driver@test.com', 'Adebayo Ogunleye', 'driver', '+2348012345686', 1, 1, NOW());

-- Insert merchants
INSERT INTO merchants (id, user_id, business_name, business_type, address, latitude, longitude, rating, is_verified, is_active, created_at)
VALUES
('merch_001', 'merch_001', 'Shell Jabi', 'fuel_station', 'Plot 123, Jabi District, Abuja', 9.0679, 7.4345, 4.5, 1, 1, NOW());

-- Insert products
INSERT INTO products (id, merchant_id, name, description, category, unit, price, stock_quantity, image_url, is_available, created_at)
VALUES
('prod_001', 'merch_001', 'Premium Motor Spirit (PMS)', 'High-quality petrol for all vehicles', 'fuel', 'litre', 617.00, 5000, NULL, 1, NOW());

-- Insert orders
INSERT INTO orders (id, user_id, merchant_id, status, total_amount, subtotal, delivery_fee, delivery_address, payment_method, created_at)
VALUES
('order_001', 'user_001', 'merch_001', 'DELIVERED', 30500.00, 30000.00, 500.00, '12 Maitama Street, Abuja', 'card', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Insert order_items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at)
VALUES
('oi_001', 'order_001', 'prod_001', 50, 617.00, 30850.00, NOW());

-- Insert driver locations
INSERT INTO driver_locations (id, driver_id, latitude, longitude, heading, speed)
VALUES
('dl_001', 'driver_001', 9.0765, 7.4897, 90, 45.5);
