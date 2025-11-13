
-- Comprehensive Seed Data for Brill Prime App
-- This script populates the database with realistic test data

-- First, let's insert test users for each role
INSERT INTO users (id, email, role, full_name, phone_number, is_verified, created_at) VALUES
-- Consumers
('consumer-1', 'john.consumer@test.com', 'consumer', 'John Doe', '+2348012345671', true, NOW()),
('consumer-2', 'jane.consumer@test.com', 'consumer', 'Jane Smith', '+2348012345672', true, NOW()),
('consumer-3', 'alex.consumer@test.com', 'consumer', 'Alex Johnson', '+2348012345673', true, NOW()),

-- Merchants
('merchant-1', 'fresh.market@test.com', 'merchant', 'Fresh Market Lagos', '+2348012345681', true, NOW()),
('merchant-2', 'grain.hub@test.com', 'merchant', 'Grain Hub Abuja', '+2348012345682', true, NOW()),
('merchant-3', 'veggie.store@test.com', 'merchant', 'Veggie Store PH', '+2348012345683', true, NOW()),
('merchant-4', 'meat.shop@test.com', 'merchant', 'Premium Meats', '+2348012345684', true, NOW()),
('merchant-5', 'fish.market@test.com', 'merchant', 'Ocean Fresh Market', '+2348012345685', true, NOW()),
('merchant-6', 'dairy.farm@test.com', 'merchant', 'Dairy Farm Direct', '+2348012345686', true, NOW()),
('merchant-7', 'spice.bazaar@test.com', 'merchant', 'Spice Bazaar', '+2348012345687', true, NOW()),
('merchant-8', 'fruit.paradise@test.com', 'merchant', 'Fruit Paradise', '+2348012345688', true, NOW()),
('merchant-9', 'bulk.foods@test.com', 'merchant', 'Bulk Foods Ltd', '+2348012345689', true, NOW()),
('merchant-10', 'organic.farm@test.com', 'merchant', 'Organic Farm Co', '+2348012345690', true, NOW()),

-- Drivers
('driver-1', 'driver1@test.com', 'driver', 'Michael Driver', '+2348012345691', true, NOW()),
('driver-2', 'driver2@test.com', 'driver', 'Sarah Wheels', '+2348012345692', true, NOW()),
('driver-3', 'driver3@test.com', 'driver', 'David Fast', '+2348012345693', true, NOW()),
('driver-4', 'driver4@test.com', 'driver', 'Emma Quick', '+2348012345694', true, NOW()),
('driver-5', 'driver5@test.com', 'driver', 'James Speed', '+2348012345695', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert merchant profiles with locations across Nigeria
INSERT INTO merchant_profiles (user_id, business_name, business_type, address, city, state, latitude, longitude, is_verified, rating, total_reviews) VALUES
('merchant-1', 'Fresh Market Lagos', 'Supermarket', '123 Admiralty Way, Lekki', 'Lagos', 'Lagos', 6.4531, 3.4201, true, 4.5, 120),
('merchant-2', 'Grain Hub Abuja', 'Wholesale', '45 Maitama District', 'Abuja', 'FCT', 9.0820, 7.5324, true, 4.7, 89),
('merchant-3', 'Veggie Store PH', 'Grocery', '78 GRA Phase 2', 'Port Harcourt', 'Rivers', 4.8156, 7.0498, true, 4.3, 67),
('merchant-4', 'Premium Meats', 'Butcher', '34 Allen Avenue, Ikeja', 'Lagos', 'Lagos', 6.6018, 3.3515, true, 4.6, 95),
('merchant-5', 'Ocean Fresh Market', 'Fish Market', '12 Marina Road', 'Lagos', 'Lagos', 6.4550, 3.4242, true, 4.4, 78),
('merchant-6', 'Dairy Farm Direct', 'Dairy', '56 Ring Road', 'Ibadan', 'Oyo', 7.3775, 3.9470, true, 4.8, 102),
('merchant-7', 'Spice Bazaar', 'Grocery', '90 Balogun Market', 'Lagos', 'Lagos', 6.4541, 3.3947, true, 4.2, 143),
('merchant-8', 'Fruit Paradise', 'Fruit Market', '23 Oba Akran Avenue', 'Lagos', 'Lagos', 6.6124, 3.3541, true, 4.5, 88),
('merchant-9', 'Bulk Foods Ltd', 'Wholesale', '67 Trans Amadi', 'Port Harcourt', 'Rivers', 4.8095, 7.0324, true, 4.6, 76),
('merchant-10', 'Organic Farm Co', 'Farm Shop', '15 Jabi Lake Mall', 'Abuja', 'FCT', 9.0643, 7.4892, true, 4.9, 112)
ON CONFLICT (user_id) DO NOTHING;

-- Insert driver profiles with vehicle info
INSERT INTO driver_profiles (user_id, license_number, vehicle_type, vehicle_plate, is_verified, is_available, rating, total_deliveries) VALUES
('driver-1', 'LGS-2023-001234', 'Motorcycle', 'ABC-123-DE', true, true, 4.7, 450),
('driver-2', 'ABJ-2023-005678', 'Van', 'XYZ-456-FG', true, true, 4.8, 380),
('driver-3', 'PH-2023-009012', 'Motorcycle', 'LMN-789-HI', true, true, 4.6, 520),
('driver-4', 'LGS-2023-003456', 'Car', 'PQR-321-JK', true, true, 4.9, 290),
('driver-5', 'ABJ-2023-007890', 'Motorcycle', 'STU-654-LM', true, false, 4.5, 610)
ON CONFLICT (user_id) DO NOTHING;

-- Insert commodities (diverse range of products)
INSERT INTO commodities (merchant_id, name, description, category, price, unit, stock_quantity, image_url, is_available) VALUES
-- Fresh Market Lagos products
('merchant-1', 'Fresh Tomatoes', 'Locally sourced ripe tomatoes', 'Vegetables', 500.00, 'kg', 150, 'https://images.unsplash.com/photo-1546470427-227c7b0a88a3?w=400', true),
('merchant-1', 'White Rice', 'Premium quality long grain rice', 'Grains', 15000.00, '50kg bag', 80, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', true),
('merchant-1', 'Onions', 'Fresh red onions', 'Vegetables', 800.00, 'kg', 200, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400', true),
('merchant-1', 'Sweet Peppers', 'Fresh bell peppers mix', 'Vegetables', 1200.00, 'kg', 90, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400', true),

-- Grain Hub Abuja products
('merchant-2', 'Brown Beans', 'Nigerian brown beans', 'Grains', 8000.00, '25kg bag', 120, 'https://images.unsplash.com/photo-1596097635121-9265ab841316?w=400', true),
('merchant-2', 'Yellow Garri', 'Premium yellow garri', 'Grains', 3500.00, '10kg bag', 200, 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400', true),
('merchant-2', 'Corn Flour', 'Ground yellow corn', 'Grains', 2500.00, '5kg bag', 150, 'https://images.unsplash.com/photo-1551623073-8c0ad49c9c04?w=400', true),

-- Veggie Store PH products
('merchant-3', 'Spinach', 'Fresh green spinach', 'Vegetables', 600.00, 'bunch', 100, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', true),
('merchant-3', 'Carrots', 'Orange carrots', 'Vegetables', 700.00, 'kg', 80, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', true),
('merchant-3', 'Cucumbers', 'Fresh cucumbers', 'Vegetables', 500.00, 'kg', 120, 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400', true),

-- Premium Meats products
('merchant-4', 'Beef Cuts', 'Fresh premium beef', 'Meat', 3500.00, 'kg', 60, 'https://images.unsplash.com/photo-1588347818036-49425e47b03d?w=400', true),
('merchant-4', 'Chicken (Whole)', 'Farm fresh whole chicken', 'Meat', 4500.00, 'per bird', 45, 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400', true),
('merchant-4', 'Goat Meat', 'Fresh goat meat', 'Meat', 4000.00, 'kg', 35, 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400', true),

-- Ocean Fresh Market products
('merchant-5', 'Tilapia Fish', 'Fresh tilapia', 'Seafood', 2500.00, 'kg', 70, 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400', true),
('merchant-5', 'Prawns', 'Large prawns', 'Seafood', 5500.00, 'kg', 40, 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400', true),
('merchant-5', 'Catfish', 'Fresh catfish', 'Seafood', 3000.00, 'kg', 55, 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400', true),

-- Dairy Farm Direct products
('merchant-6', 'Fresh Milk', 'Pasteurized whole milk', 'Dairy', 1500.00, 'liter', 100, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', true),
('merchant-6', 'Yogurt', 'Natural yogurt', 'Dairy', 800.00, '500ml', 80, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', true),
('merchant-6', 'Cheese', 'Local cheese', 'Dairy', 2000.00, '250g', 60, 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400', true),

-- Spice Bazaar products
('merchant-7', 'Black Pepper', 'Ground black pepper', 'Spices', 3000.00, '500g', 90, 'https://images.unsplash.com/photo-1599909533084-8d7e5a3f3b03?w=400', true),
('merchant-7', 'Curry Powder', 'Nigerian curry blend', 'Spices', 1500.00, '250g', 110, 'https://images.unsplash.com/photo-1599909533084-8d7e5a3f3b03?w=400', true),
('merchant-7', 'Thyme', 'Dried thyme leaves', 'Spices', 1200.00, '100g', 85, 'https://images.unsplash.com/photo-1599909533084-8d7e5a3f3b03?w=400', true),

-- Fruit Paradise products
('merchant-8', 'Oranges', 'Sweet oranges', 'Fruits', 1000.00, 'dozen', 150, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400', true),
('merchant-8', 'Bananas', 'Ripe bananas', 'Fruits', 800.00, 'dozen', 200, 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400', true),
('merchant-8', 'Watermelon', 'Sweet watermelon', 'Fruits', 2500.00, 'per fruit', 45, 'https://images.unsplash.com/photo-1589984662646-e7b2e4962242?w=400', true),
('merchant-8', 'Pineapple', 'Fresh pineapple', 'Fruits', 1500.00, 'per fruit', 80, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400', true),

-- Bulk Foods Ltd products
('merchant-9', 'Palm Oil', 'Red palm oil', 'Oil', 12000.00, '25 liters', 70, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', true),
('merchant-9', 'Groundnut Oil', 'Pure groundnut oil', 'Oil', 15000.00, '25 liters', 50, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', true),

-- Organic Farm Co products
('merchant-10', 'Organic Vegetables Mix', 'Mixed organic vegetables', 'Vegetables', 3500.00, '5kg basket', 40, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', true),
('merchant-10', 'Free Range Eggs', 'Organic free range eggs', 'Dairy', 2000.00, 'crate (30)', 65, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400', true),
('merchant-10', 'Honey', 'Pure organic honey', 'Condiments', 4500.00, '500ml', 35, 'https://images.unsplash.com/photo-1587049352846-4a222e784720?w=400', true)
ON CONFLICT DO NOTHING;

-- Insert sample orders with various statuses
INSERT INTO orders (id, consumer_id, merchant_id, driver_id, total_amount, delivery_fee, status, payment_method, delivery_address, delivery_latitude, delivery_longitude, created_at, updated_at) VALUES
-- Completed orders
('order-1', 'consumer-1', 'merchant-1', 'driver-1', 25000.00, 1500.00, 'delivered', 'card', '10 Victoria Island, Lagos', 6.4281, 3.4219, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('order-2', 'consumer-2', 'merchant-4', 'driver-2', 18000.00, 1200.00, 'delivered', 'cash', '45 Wuse 2, Abuja', 9.0579, 7.4951, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('order-3', 'consumer-3', 'merchant-8', 'driver-3', 12500.00, 1000.00, 'delivered', 'card', '23 GRA, Port Harcourt', 4.8245, 7.0334, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- In-progress orders
('order-4', 'consumer-1', 'merchant-2', 'driver-1', 32000.00, 1800.00, 'in_transit', 'card', '12 Lekki Phase 1, Lagos', 6.4403, 3.4654, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 minutes'),
('order-5', 'consumer-2', 'merchant-5', 'driver-4', 22000.00, 1500.00, 'preparing', 'cash', '67 Asokoro, Abuja', 9.0369, 7.5324, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '10 minutes'),

-- Pending orders
('order-6', 'consumer-3', 'merchant-3', NULL, 15000.00, 1200.00, 'pending', 'card', '89 Trans Amadi, PH', 4.8095, 7.0324, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
('order-7', 'consumer-1', 'merchant-7', NULL, 8500.00, 800.00, 'confirmed', 'cash', '34 Ikoyi, Lagos', 6.4569, 3.4348, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert order items
INSERT INTO order_items (order_id, commodity_id, quantity, price_at_time) VALUES
-- Order 1 items
('order-1', (SELECT id FROM commodities WHERE name = 'White Rice' AND merchant_id = 'merchant-1' LIMIT 1), 1, 15000.00),
('order-1', (SELECT id FROM commodities WHERE name = 'Fresh Tomatoes' AND merchant_id = 'merchant-1' LIMIT 1), 10, 500.00),
('order-1', (SELECT id FROM commodities WHERE name = 'Onions' AND merchant_id = 'merchant-1' LIMIT 1), 5, 800.00),

-- Order 2 items
('order-2', (SELECT id FROM commodities WHERE name = 'Beef Cuts' AND merchant_id = 'merchant-4' LIMIT 1), 4, 3500.00),
('order-2', (SELECT id FROM commodities WHERE name = 'Chicken (Whole)' AND merchant_id = 'merchant-4' LIMIT 1), 1, 4500.00),

-- Order 3 items
('order-3', (SELECT id FROM commodities WHERE name = 'Oranges' AND merchant_id = 'merchant-8' LIMIT 1), 5, 1000.00),
('order-3', (SELECT id FROM commodities WHERE name = 'Bananas' AND merchant_id = 'merchant-8' LIMIT 1), 8, 800.00),

-- Order 4 items
('order-4', (SELECT id FROM commodities WHERE name = 'Brown Beans' AND merchant_id = 'merchant-2' LIMIT 1), 2, 8000.00),
('order-4', (SELECT id FROM commodities WHERE name = 'Yellow Garri' AND merchant_id = 'merchant-2' LIMIT 1), 4, 3500.00),

-- Order 5 items
('order-5', (SELECT id FROM commodities WHERE name = 'Tilapia Fish' AND merchant_id = 'merchant-5' LIMIT 1), 5, 2500.00),
('order-5', (SELECT id FROM commodities WHERE name = 'Prawns' AND merchant_id = 'merchant-5' LIMIT 1), 2, 5500.00),

-- Order 6 items
('order-6', (SELECT id FROM commodities WHERE name = 'Spinach' AND merchant_id = 'merchant-3' LIMIT 1), 10, 600.00),
('order-6', (SELECT id FROM commodities WHERE name = 'Carrots' AND merchant_id = 'merchant-3' LIMIT 1), 12, 700.00),

-- Order 7 items
('order-7', (SELECT id FROM commodities WHERE name = 'Black Pepper' AND merchant_id = 'merchant-7' LIMIT 1), 2, 3000.00),
('order-7', (SELECT id FROM commodities WHERE name = 'Curry Powder' AND merchant_id = 'merchant-7' LIMIT 1), 1, 1500.00)
ON CONFLICT DO NOTHING;

-- Insert driver locations (for real-time tracking)
INSERT INTO driver_locations (driver_id, latitude, longitude, heading, speed, updated_at) VALUES
('driver-1', 6.4403, 3.4654, 45.0, 35.5, NOW()),
('driver-2', 9.0579, 7.4951, 180.0, 0.0, NOW()),
('driver-3', 4.8245, 7.0334, 90.0, 42.3, NOW()),
('driver-4', 9.0369, 7.5324, 270.0, 28.7, NOW()),
('driver-5', 6.6018, 3.3515, 135.0, 0.0, NOW())
ON CONFLICT (driver_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  heading = EXCLUDED.heading,
  speed = EXCLUDED.speed,
  updated_at = EXCLUDED.updated_at;

-- Insert reviews and ratings
INSERT INTO reviews (order_id, reviewer_id, reviewee_id, reviewee_type, rating, comment, created_at) VALUES
('order-1', 'consumer-1', 'merchant-1', 'merchant', 5, 'Excellent service! Fresh products and fast delivery.', NOW() - INTERVAL '4 days'),
('order-1', 'consumer-1', 'driver-1', 'driver', 5, 'Very professional driver, delivered on time.', NOW() - INTERVAL '4 days'),
('order-2', 'consumer-2', 'merchant-4', 'merchant', 4, 'Good quality meat, will order again.', NOW() - INTERVAL '2 days'),
('order-2', 'consumer-2', 'driver-2', 'driver', 5, 'Friendly and careful with the package.', NOW() - INTERVAL '2 days'),
('order-3', 'consumer-3', 'merchant-8', 'merchant', 5, 'Best fruits in town!', NOW() - INTERVAL '1 day'),
('order-3', 'consumer-3', 'driver-3', 'driver', 4, 'Good service, slightly delayed.', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert transactions
INSERT INTO transactions (order_id, user_id, amount, transaction_type, payment_method, status, reference, created_at) VALUES
('order-1', 'consumer-1', 26500.00, 'payment', 'card', 'completed', 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001', NOW() - INTERVAL '5 days'),
('order-2', 'consumer-2', 19200.00, 'payment', 'cash', 'completed', 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002', NOW() - INTERVAL '3 days'),
('order-3', 'consumer-3', 13500.00, 'payment', 'card', 'completed', 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-003', NOW() - INTERVAL '2 days'),
('order-4', 'consumer-1', 33800.00, 'payment', 'card', 'pending', 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-004', NOW() - INTERVAL '2 hours'),
('order-5', 'consumer-2', 23500.00, 'payment', 'cash', 'pending', 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-005', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

-- Insert notifications
INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at) VALUES
('consumer-1', 'order', 'Order Delivered', 'Your order #order-1 has been delivered', '{"order_id": "order-1"}', true, NOW() - INTERVAL '4 days'),
('merchant-1', 'order', 'New Order', 'You have a new order #order-1', '{"order_id": "order-1"}', true, NOW() - INTERVAL '5 days'),
('driver-1', 'delivery', 'New Delivery', 'New delivery assignment #order-4', '{"order_id": "order-4"}', false, NOW() - INTERVAL '2 hours'),
('consumer-2', 'order', 'Order Confirmed', 'Your order #order-5 is being prepared', '{"order_id": "order-5"}', false, NOW() - INTERVAL '30 minutes'),
('merchant-3', 'order', 'New Order', 'You have a new order #order-6', '{"order_id": "order-6"}', false, NOW() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database seeded successfully with comprehensive test data!';
  RAISE NOTICE 'Created: 3 consumers, 10 merchants, 5 drivers';
  RAISE NOTICE 'Added: 30+ commodities, 7 orders, multiple reviews and transactions';
END $$;
