-- Enhanced Seed Data for Brill Prime
-- Includes all missing tables: drivers, delivery_zones, order_locations, 
-- review_votes, review_responses, user_privacy_settings, 
-- data_deletion_requests, data_export_requests, transactions, 
-- wallet_balances, withdrawal_requests

-- Clear existing data (in correct order to avoid FK conflicts)
TRUNCATE TABLE 
  withdrawal_requests, wallet_balances, transactions,
  data_export_requests, data_deletion_requests, user_privacy_settings,
  review_responses, review_votes,
  order_locations, delivery_zones, drivers,
  order_items, cart_items, orders, driver_locations, commodities, merchants, users 
CASCADE;

-- Insert Test Users (10 consumers, 5 merchants, 5 drivers)
INSERT INTO users (id, email, full_name, phone_number, role, is_verified) VALUES
-- Consumers
('user_001', 'john.consumer@test.com', 'John Doe', '+2348012345671', 'consumer', true),
('user_002', 'jane.consumer@test.com', 'Jane Smith', '+2348012345672', 'consumer', true),
('user_003', 'mike.consumer@test.com', 'Mike Johnson', '+2348012345673', 'consumer', true),
('user_004', 'sarah.consumer@test.com', 'Sarah Williams', '+2348012345674', 'consumer', true),
('user_005', 'david.consumer@test.com', 'David Brown', '+2348012345675', 'consumer', true),
('user_006', 'emily.consumer@test.com', 'Emily Davis', '+2348012345676', 'consumer', true),
('user_007', 'chris.consumer@test.com', 'Chris Miller', '+2348012345677', 'consumer', true),
('user_008', 'lisa.consumer@test.com', 'Lisa Wilson', '+2348012345678', 'consumer', true),
('user_009', 'james.consumer@test.com', 'James Moore', '+2348012345679', 'consumer', true),
('user_010', 'anna.consumer@test.com', 'Anna Taylor', '+2348012345680', 'consumer', true),

-- Merchants
('merch_001', 'shell.station@test.com', 'Shell Station', '+2348012345681', 'merchant', true),
('merch_002', 'total.fuel@test.com', 'Total Energies', '+2348012345682', 'merchant', true),
('merch_003', 'shoprite.store@test.com', 'Shoprite Supermarket', '+2348012345683', 'merchant', true),
('merch_004', 'game.stores@test.com', 'Game Stores', '+2348012345684', 'merchant', true),
('merch_005', 'jumia.food@test.com', 'Jumia Food', '+2348012345685', 'merchant', true),

-- Drivers
('driver_001', 'ade.driver@test.com', 'Adebayo Ogunleye', '+2348012345686', 'driver', true),
('driver_002', 'chidi.driver@test.com', 'Chidi Okeke', '+2348012345687', 'driver', true),
('driver_003', 'bola.driver@test.com', 'Bola Ahmed', '+2348012345688', 'driver', true),
('driver_004', 'emeka.driver@test.com', 'Emeka Eze', '+2348012345689', 'driver', true),
('driver_005', 'fatima.driver@test.com', 'Fatima Hassan', '+2348012345690', 'driver', true);

-- Insert Merchants with realistic Abuja locations
INSERT INTO merchants (id, user_id, business_name, business_type, address, location, phone_number, email, rating, is_verified, is_active) VALUES
('merch_001', 'merch_001', 'Shell Jabi', 'fuel_station', 'Plot 123, Jabi District, Abuja', ST_GeogFromText('POINT(7.4345 9.0679)'), '+2348012345681', 'shell.jabi@test.com', 4.5, true, true),
('merch_002', 'merch_002', 'Total Gwarimpa', 'fuel_station', '45 Gwarimpa Estate, Abuja', ST_GeogFromText('POINT(7.4114 9.1103)'), '+2348012345682', 'total.gwarimpa@test.com', 4.2, true, true),
('merch_003', 'merch_003', 'Shoprite Jabi Lake Mall', 'supermarket', 'Jabi Lake Mall, Abuja', ST_GeogFromText('POINT(7.4897 9.0765)'), '+2348012345683', 'shoprite.jabi@test.com', 4.7, true, true),
('merch_004', 'merch_004', 'Game Ceddi Plaza', 'supermarket', 'Ceddi Plaza, Central Business District, Abuja', ST_GeogFromText('POINT(7.4951 9.0579)'), '+2348012345684', 'game.ceddi@test.com', 4.3, true, true),
('merch_005', 'merch_005', 'Jumia Food Wuse 2', 'restaurant', '15 Adetokunbo Ademola Crescent, Wuse 2, Abuja', ST_GeogFromText('POINT(7.4820 9.0643)'), '+2348012345685', 'jumia.wuse@test.com', 4.6, true, true);

-- Insert Drivers with vehicle information
INSERT INTO drivers (id, user_id, vehicle_type, vehicle_model, vehicle_plate, license_number, license_expiry, is_available, is_verified, rating, total_deliveries) VALUES
('driver_001', 'driver_001', 'motorcycle', 'Honda CB150', 'ABJ-123A', 'DL1234567890', '2025-12-31', true, true, 4.8, 150),
('driver_002', 'driver_002', 'motorcycle', 'Yamaha FZ16', 'ABJ-456B', 'DL0987654321', '2026-06-30', true, true, 4.5, 120),
('driver_003', 'driver_003', 'car', 'Toyota Corolla', 'ABJ-789C', 'DL1122334455', '2025-09-15', true, true, 4.9, 200),
('driver_004', 'driver_004', 'van', 'Nissan NV200', 'ABJ-012D', 'DL5566778899', '2026-03-20', false, true, 4.3, 85),
('driver_005', 'driver_005', 'motorcycle', 'Suzuki GSX-R150', 'ABJ-345E', 'DL9988776655', '2025-11-30', true, true, 4.7, 175);

-- Insert Delivery Zones
INSERT INTO delivery_zones (id, merchant_id, name, polygon, delivery_fee, min_order_amount, estimated_time_minutes, is_active) VALUES
('zone_001', 'merch_001', 'Jabi Zone', ST_GeogFromText('POLYGON((7.4245 9.0579, 7.4445 9.0579, 7.4445 9.0779, 7.4245 9.0779, 7.4245 9.0579))'), 500.00, 2000.00, 30, true),
('zone_002', 'merch_001', 'Gwarimpa Zone', ST_GeogFromText('POLYGON((7.4014 9.1003, 7.4214 9.1003, 7.4214 9.1203, 7.4014 9.1203, 7.4014 9.1003))'), 700.00, 3000.00, 45, true),
('zone_003', 'merch_002', 'CBD Zone', ST_GeogFromText('POLYGON((7.4851 9.0479, 7.5051 9.0479, 7.5051 9.0679, 7.4851 9.0679, 7.4851 9.0479))'), 600.00, 2500.00, 35, true),
('zone_004', 'merch_003', 'Jabi Lake Mall Zone', ST_GeogFromText('POLYGON((7.4797 9.0665, 7.4997 9.0665, 7.4997 9.0865, 7.4797 9.0865, 7.4797 9.0665))'), 400.00, 1500.00, 25, true),
('zone_005', 'merch_005', 'Wuse 2 Zone', ST_GeogFromText('POLYGON((7.4720 9.0543, 7.4920 9.0543, 7.4920 9.0743, 7.4720 9.0743, 7.4720 9.0543))'), 300.00, 1000.00, 20, true);

-- Insert Commodities (50+ items across categories)
INSERT INTO products (id, merchant_id, name, description, category, price, unit, stock_quantity, image_url, is_available) VALUES
-- Fuel Products (10 items)
('prod_001', 'merch_001', 'Premium Motor Spirit (PMS)', 'High-quality petrol for all vehicles', 'fuel', 617.00, 'litre', 5000, 'https://example.com/pms.jpg', true),
('prod_002', 'merch_001', 'Automotive Gas Oil (AGO)', 'Diesel fuel for heavy vehicles', 'fuel', 720.00, 'litre', 3000, 'https://example.com/ago.jpg', true),
('prod_003', 'merch_001', 'Dual Purpose Kerosene (DPK)', 'Kerosene for cooking and lighting', 'fuel', 580.00, 'litre', 2000, 'https://example.com/dpk.jpg', true),
('prod_004', 'merch_002', 'Premium Motor Spirit (PMS)', 'Total branded petrol', 'fuel', 615.00, 'litre', 6000, 'https://example.com/total-pms.jpg', true),
('prod_005', 'merch_002', 'Automotive Gas Oil (AGO)', 'Total diesel', 'fuel', 715.00, 'litre', 4000, 'https://example.com/total-ago.jpg', true),
('prod_006', 'merch_001', 'Engine Oil 5W-30', 'Synthetic engine oil', 'fuel', 8500.00, 'bottle', 100, 'https://example.com/engine-oil.jpg', true),
('prod_007', 'merch_002', 'Engine Oil 10W-40', 'Semi-synthetic engine oil', 'fuel', 6500.00, 'bottle', 80, 'https://example.com/engine-oil-2.jpg', true),
('prod_008', 'merch_001', 'Brake Fluid', 'DOT 4 brake fluid', 'fuel', 2500.00, 'bottle', 50, 'https://example.com/brake-fluid.jpg', true),
('prod_009', 'merch_002', 'Coolant/Antifreeze', 'Engine coolant', 'fuel', 3500.00, 'bottle', 60, 'https://example.com/coolant.jpg', true),
('prod_010', 'merch_001', 'Windshield Washer Fluid', 'Glass cleaner fluid', 'fuel', 1200.00, 'bottle', 40, 'https://example.com/washer-fluid.jpg', true),

-- Groceries (20 items)
('prod_011', 'merch_003', 'Basmati Rice 5kg', 'Premium long grain rice', 'groceries', 7500.00, 'bag', 200, 'https://example.com/rice.jpg', true),
('prod_012', 'merch_003', 'Vegetable Oil 5L', 'Pure vegetable cooking oil', 'groceries', 12000.00, 'bottle', 150, 'https://example.com/oil.jpg', true),
('prod_013', 'merch_003', 'Sugar 2kg', 'Granulated white sugar', 'groceries', 2800.00, 'pack', 300, 'https://example.com/sugar.jpg', true),
('prod_014', 'merch_003', 'Salt 1kg', 'Iodized table salt', 'groceries', 450.00, 'pack', 250, 'https://example.com/salt.jpg', true),
('prod_015', 'merch_003', 'Tomato Paste 400g', 'Concentrated tomato paste', 'groceries', 850.00, 'can', 180, 'https://example.com/tomato-paste.jpg', true),
('prod_016', 'merch_004', 'Bread Loaf', 'Fresh white bread', 'groceries', 1200.00, 'loaf', 100, 'https://example.com/bread.jpg', true),
('prod_017', 'merch_004', 'Milk 1L', 'Fresh cow milk', 'groceries', 1500.00, 'carton', 80, 'https://example.com/milk.jpg', true),
('prod_018', 'merch_003', 'Eggs (Crate)', '30 pieces', 'groceries', 3500.00, 'crate', 50, 'https://example.com/eggs.jpg', true),
('prod_019', 'merch_003', 'Chicken 1kg', 'Fresh frozen chicken', 'groceries', 4200.00, 'kg', 120, 'https://example.com/chicken.jpg', true),
('prod_020', 'merch_004', 'Beef 1kg', 'Fresh beef cuts', 'groceries', 6500.00, 'kg', 90, 'https://example.com/beef.jpg', true),
('prod_021', 'merch_003', 'Onions 1kg', 'Fresh red onions', 'groceries', 1800.00, 'kg', 200, 'https://example.com/onions.jpg', true),
('prod_022', 'merch_003', 'Tomatoes 1kg', 'Fresh tomatoes', 'groceries', 2200.00, 'kg', 180, 'https://example.com/tomatoes.jpg', true),
('prod_023', 'merch_004', 'Potatoes 5kg', 'Irish potatoes', 'groceries', 4500.00, 'bag', 100, 'https://example.com/potatoes.jpg', true),
('prod_024', 'merch_003', 'Carrots 1kg', 'Fresh carrots', 'groceries', 1500.00, 'kg', 150, 'https://example.com/carrots.jpg', true),
('prod_025', 'merch_004', 'Green Beans 500g', 'Fresh green beans', 'groceries', 1200.00, 'pack', 80, 'https://example.com/green-beans.jpg', true),
('prod_026', 'merch_003', 'Spaghetti 500g', 'Durum wheat pasta', 'groceries', 950.00, 'pack', 200, 'https://example.com/spaghetti.jpg', true),
('prod_027', 'merch_004', 'Cornflakes 500g', 'Breakfast cereal', 'groceries', 2800.00, 'box', 100, 'https://example.com/cornflakes.jpg', true),
('prod_028', 'merch_003', 'Tea Bags 100pcs', 'Black tea', 'groceries', 1500.00, 'box', 120, 'https://example.com/tea.jpg', true),
('prod_029', 'merch_004', 'Coffee 200g', 'Instant coffee', 'groceries', 3500.00, 'jar', 90, 'https://example.com/coffee.jpg', true),
('prod_030', 'merch_003', 'Bottled Water 75cl', 'Pure drinking water', 'groceries', 250.00, 'bottle', 500, 'https://example.com/water.jpg', true),

-- Food/Restaurant Items (20 items)
('prod_031', 'merch_005', 'Jollof Rice', 'Nigerian jollof rice with chicken', 'food', 3500.00, 'plate', 50, 'https://example.com/jollof.jpg', true),
('prod_032', 'merch_005', 'Fried Rice', 'Special fried rice', 'food', 3200.00, 'plate', 50, 'https://example.com/fried-rice.jpg', true),
('prod_033', 'merch_005', 'Pounded Yam & Egusi', 'Traditional dish', 'food', 4500.00, 'plate', 40, 'https://example.com/pounded-yam.jpg', true),
('prod_034', 'merch_005', 'Amala & Ewedu', 'Yoruba delicacy', 'food', 3800.00, 'plate', 40, 'https://example.com/amala.jpg', true),
('prod_035', 'merch_005', 'Grilled Chicken', 'Half chicken grilled', 'food', 4200.00, 'serving', 30, 'https://example.com/grilled-chicken.jpg', true),
('prod_036', 'merch_005', 'Fried Chicken', '4 pieces', 'food', 3500.00, 'serving', 40, 'https://example.com/fried-chicken.jpg', true),
('prod_037', 'merch_005', 'Beef Burger', 'Classic beef burger with fries', 'food', 2800.00, 'piece', 60, 'https://example.com/burger.jpg', true),
('prod_038', 'merch_005', 'Chicken Burger', 'Grilled chicken burger', 'food', 2500.00, 'piece', 60, 'https://example.com/chicken-burger.jpg', true),
('prod_039', 'merch_005', 'Pepperoni Pizza 12"', 'Large pepperoni pizza', 'food', 8500.00, 'piece', 20, 'https://example.com/pizza.jpg', true),
('prod_040', 'merch_005', 'Margherita Pizza 12"', 'Classic cheese pizza', 'food', 7500.00, 'piece', 20, 'https://example.com/margherita.jpg', true),
('prod_041', 'merch_005', 'Shawarma Wrap', 'Chicken shawarma', 'food', 2000.00, 'wrap', 80, 'https://example.com/shawarma.jpg', true),
('prod_042', 'merch_005', 'Suya 500g', 'Spicy grilled meat', 'food', 3500.00, 'pack', 50, 'https://example.com/suya.jpg', true),
('prod_043', 'merch_005', 'Pepper Soup', 'Goat meat pepper soup', 'food', 4000.00, 'bowl', 30, 'https://example.com/pepper-soup.jpg', true),
('prod_044', 'merch_005', 'Eba & Okra Soup', 'Traditional meal', 'food', 3200.00, 'plate', 40, 'https://example.com/eba.jpg', true),
('prod_045', 'merch_005', 'Chinese Fried Rice', 'Special fried rice', 'food', 3800.00, 'plate', 40, 'https://example.com/chinese-rice.jpg', true),
('prod_046', 'merch_005', 'Spring Rolls (6pcs)', 'Vegetable spring rolls', 'food', 1800.00, 'serving', 50, 'https://example.com/spring-rolls.jpg', true),
('prod_047', 'merch_005', 'Ice Cream Sundae', 'Vanilla ice cream with toppings', 'food', 1500.00, 'cup', 60, 'https://example.com/ice-cream.jpg', true),
('prod_048', 'merch_005', 'Fresh Orange Juice', 'Freshly squeezed', 'food', 1200.00, 'glass', 100, 'https://example.com/orange-juice.jpg', true),
('prod_049', 'merch_005', 'Chapman', 'Local cocktail drink', 'food', 1500.00, 'glass', 80, 'https://example.com/chapman.jpg', true),
('prod_050', 'merch_005', 'Small Chops Platter', 'Assorted finger foods', 'food', 5500.00, 'platter', 25, 'https://example.com/small-chops.jpg', true);

-- Insert Sample Orders with various statuses
INSERT INTO orders (id, user_id, merchant_id, driver_id, total_amount, subtotal, delivery_fee, status, delivery_address, delivery_latitude, delivery_longitude, payment_method, payment_status, created_at) VALUES
('order_001', 'user_001', 'merch_001', 'driver_001', 31000.00, 30500.00, 500.00, 'DELIVERED', '12 Maitama Street, Abuja', 9.0820, 7.4950, 'card', 'completed', NOW() - INTERVAL '2 days'),
('order_002', 'user_002', 'merch_003', 'driver_002', 46000.00, 45200.00, 800.00, 'DELIVERED', '45 Gwarimpa Estate, Abuja', 9.1103, 7.4114, 'card', 'completed', NOW() - INTERVAL '1 day'),
('order_003', 'user_003', 'merch_005', 'driver_003', 12600.00, 12000.00, 600.00, 'IN_TRANSIT', '78 Wuse 2, Abuja', 9.0643, 7.4820, 'cash', 'completed', NOW() - INTERVAL '2 hours'),
('order_004', 'user_001', 'merch_002', NULL, 25500.00, 25000.00, 500.00, 'CONFIRMED', '12 Maitama Street, Abuja', 9.0820, 7.4950, 'card', 'pending', NOW() - INTERVAL '30 minutes'),
('order_005', 'user_004', 'merch_004', NULL, 19200.00, 18500.00, 700.00, 'PENDING', '90 Asokoro, Abuja', 9.0333, 7.5333, 'card', 'pending', NOW() - INTERVAL '10 minutes');

-- Insert Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
('order_001', 'prod_001', 50, 617.00, 30850.00),
('order_002', 'prod_011', 5, 7500.00, 37500.00),
('order_002', 'prod_012', 1, 12000.00, 12000.00),
('order_003', 'prod_031', 2, 3500.00, 7000.00),
('order_003', 'prod_037', 2, 2800.00, 5600.00),
('order_004', 'prod_004', 40, 615.00, 24600.00),
('order_005', 'prod_019', 3, 4200.00, 12600.00),
('order_005', 'prod_021', 2, 1800.00, 3600.00);

-- Insert Driver Locations (for real-time tracking)
INSERT INTO driver_locations (driver_id, latitude, longitude, heading, speed) VALUES
('driver_001', 9.0765, 7.4897, 90, 45.5),
('driver_002', 9.0679, 7.4345, 180, 30.2),
('driver_003', 9.0643, 7.4820, 270, 50.8),
('driver_004', 9.1103, 7.4114, 45, 35.0),
('driver_005', 9.0579, 7.4951, 135, 40.5);

-- Insert Order Locations (tracking delivery journey)
INSERT INTO order_locations (id, order_id, driver_id, latitude, longitude, accuracy, heading, speed, timestamp) VALUES
('oloc_001', 'order_001', 'driver_001', 9.0820, 7.4950, 5.5, 90, 25.0, NOW() - INTERVAL '1 hour 30 minutes'),
('oloc_002', 'order_001', 'driver_001', 9.0780, 7.4920, 4.2, 95, 30.0, NOW() - INTERVAL '1 hour 15 minutes'),
('oloc_003', 'order_001', 'driver_001', 9.0765, 7.4897, 3.8, 100, 35.0, NOW() - INTERVAL '1 hour'),
('oloc_004', 'order_002', 'driver_002', 9.1103, 7.4114, 6.1, 180, 28.5, NOW() - INTERVAL '45 minutes'),
('oloc_005', 'order_002', 'driver_002', 9.1050, 7.4150, 4.7, 185, 32.0, NOW() - INTERVAL '30 minutes'),
('oloc_006', 'order_003', 'driver_003', 9.0643, 7.4820, 3.5, 270, 40.0, NOW() - INTERVAL '15 minutes');

-- Insert some cart items for active users
INSERT INTO cart_items (user_id, product_id, quantity) VALUES
('user_005', 'prod_031', 1),
('user_005', 'prod_032', 1),
('user_006', 'prod_001', 30),
('user_007', 'prod_011', 2);

-- Insert Reviews
INSERT INTO reviews (id, order_id, merchant_id, user_id, rating, comment, created_at) VALUES
('rev_001', 'order_001', 'merch_001', 'user_001', 5, 'Great service and fast delivery!', NOW() - INTERVAL '1 day'),
('rev_002', 'order_002', 'merch_003', 'user_002', 4, 'Good products, delivery took a bit long', NOW() - INTERVAL '12 hours'),
('rev_003', 'order_003', 'merch_005', 'user_003', 5, 'Amazing food and quick delivery', NOW() - INTERVAL '1 hour');

-- Insert Review Votes (helpfulness ratings)
INSERT INTO review_votes (id, review_id, user_id, vote_type, created_at) VALUES
('rvote_001', 'rev_001', 'user_002', 'helpful', NOW() - INTERVAL '20 hours'),
('rvote_002', 'rev_001', 'user_003', 'helpful', NOW() - INTERVAL '18 hours'),
('rvote_003', 'rev_002', 'user_004', 'helpful', NOW() - INTERVAL '10 hours'),
('rvote_004', 'rev_002', 'user_005', 'not_helpful', NOW() - INTERVAL '8 hours'),
('rvote_005', 'rev_003', 'user_001', 'helpful', NOW() - INTERVAL '30 minutes');

-- Insert Review Responses (merchant responses to reviews)
INSERT INTO review_responses (id, review_id, merchant_id, response_text, created_at) VALUES
('rresp_001', 'rev_001', 'merch_001', 'Thank you for your positive review! We''re glad you enjoyed our service.', NOW() - INTERVAL '22 hours'),
('rresp_002', 'rev_002', 'merch_003', 'We apologize for the delay in delivery. We''ll work on improving our delivery times.', NOW() - INTERVAL '11 hours');

-- Update helpful counts in reviews
UPDATE reviews SET helpful_count = 2 WHERE id = 'rev_001';
UPDATE reviews SET helpful_count = 1, not_helpful_count = 1 WHERE id = 'rev_002';
UPDATE reviews SET helpful_count = 1 WHERE id = 'rev_003';

-- Insert User Privacy Settings
INSERT INTO user_privacy_settings (id, user_id, data_collection, analytics, marketing_emails, location_tracking, profile_visibility, activity_status, order_history, share_with_partners, created_at) VALUES
('priv_001', 'user_001', true, true, false, true, true, true, true, false, NOW()),
('priv_002', 'user_002', true, true, true, true, true, true, true, false, NOW()),
('priv_003', 'user_003', false, false, false, false, false, false, true, false, NOW()),
('priv_004', 'user_004', true, true, false, true, true, true, true, true, NOW()),
('priv_005', 'user_005', true, false, false, true, true, true, true, false, NOW());

-- Insert Data Deletion Requests
INSERT INTO data_deletion_requests (id, user_id, email, status, requested_at, notes) VALUES
('ddr_001', 'user_006', 'chris.consumer@test.com', 'pending', NOW() - INTERVAL '2 days', 'Requested account deletion'),
('ddr_002', 'user_007', 'lisa.consumer@test.com', 'processing', NOW() - INTERVAL '1 day', 'Verification in progress');

-- Insert Data Export Requests
INSERT INTO data_export_requests (id, user_id, email, status, requested_at, expires_at) VALUES
('der_001', 'user_008', 'james.consumer@test.com', 'pending', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '7 days'),
('der_002', 'user_009', 'anna.consumer@test.com', 'completed', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days');

-- Insert Wallet Balances
INSERT INTO wallet_balances (id, user_id, balance, pending_balance, total_earned, total_withdrawn) VALUES
('wb_001', 'user_001', 15000.00, 0.00, 25000.00, 10000.00),
('wb_002', 'user_002', 8500.00, 2000.00, 15000.00, 4500.00),
('wb_003', 'user_003', 32000.00, 0.00, 45000.00, 13000.00),
('wb_004', 'merch_001', 56000.00, 5000.00, 120000.00, 59000.00),
('wb_005', 'merch_002', 34000.00, 3000.00, 85000.00, 44000.00),
('wb_006', 'driver_001', 22000.00, 0.00, 35000.00, 13000.00),
('wb_007', 'driver_002', 18000.00, 1500.00, 28000.00, 11500.00);

-- Insert Transactions
INSERT INTO transactions (id, user_id, order_id, amount, type, status, payment_method, payment_reference, description, created_at, completed_at) VALUES
('trans_001', 'user_001', 'order_001', 31000.00, 'order_payment', 'completed', 'card', 'txn_001', 'Payment for order #order_001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('trans_002', 'user_002', 'order_002', 46000.00, 'order_payment', 'completed', 'card', 'txn_002', 'Payment for order #order_002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('trans_003', 'user_003', 'order_003', 12600.00, 'order_payment', 'completed', 'cash', 'txn_003', 'Cash payment for order #order_003', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('trans_004', 'merch_001', 'order_001', 2500.00, 'commission', 'completed', NULL, 'comm_001', 'Commission for order #order_001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('trans_005', 'driver_001', 'order_001', 1500.00, 'commission', 'completed', NULL, 'drv_001', 'Delivery fee for order #order_001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('trans_006', 'merch_003', 'order_002', 3200.00, 'commission', 'completed', NULL, 'comm_002', 'Commission for order #order_002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('trans_007', 'driver_002', 'order_002', 2000.00, 'commission', 'completed', NULL, 'drv_002', 'Delivery fee for order #order_002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert Withdrawal Requests
INSERT INTO withdrawal_requests (id, user_id, amount, bank_account_id, status, notes, created_at) VALUES
('wr_001', 'merch_001', 15000.00, NULL, 'pending', 'Weekly earnings withdrawal', NOW() - INTERVAL '3 days'),
('wr_002', 'driver_001', 5000.00, NULL, 'approved', 'Fuel expenses reimbursement', NOW() - INTERVAL '2 days'),
('wr_003', 'merch_002', 10000.00, NULL, 'processing', 'Monthly profits withdrawal', NOW() - INTERVAL '1 day');

COMMIT;