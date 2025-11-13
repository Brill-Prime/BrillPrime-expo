
-- Comprehensive Test Data for Brill Prime
-- Run this after schema.sql

-- Clear existing data (in correct order to avoid FK conflicts)
TRUNCATE TABLE order_items, cart_items, orders, driver_locations, commodities, merchants, users CASCADE;

-- Insert Test Users (10 consumers, 5 merchants, 5 drivers)
INSERT INTO users (id, email, first_name, last_name, phone_number, role, is_verified) VALUES
-- Consumers
('user_001', 'john.consumer@test.com', 'John', 'Doe', '+2348012345671', 'consumer', true),
('user_002', 'jane.consumer@test.com', 'Jane', 'Smith', '+2348012345672', 'consumer', true),
('user_003', 'mike.consumer@test.com', 'Mike', 'Johnson', '+2348012345673', 'consumer', true),
('user_004', 'sarah.consumer@test.com', 'Sarah', 'Williams', '+2348012345674', 'consumer', true),
('user_005', 'david.consumer@test.com', 'David', 'Brown', '+2348012345675', 'consumer', true),
('user_006', 'emily.consumer@test.com', 'Emily', 'Davis', '+2348012345676', 'consumer', true),
('user_007', 'chris.consumer@test.com', 'Chris', 'Miller', '+2348012345677', 'consumer', true),
('user_008', 'lisa.consumer@test.com', 'Lisa', 'Wilson', '+2348012345678', 'consumer', true),
('user_009', 'james.consumer@test.com', 'James', 'Moore', '+2348012345679', 'consumer', true),
('user_010', 'anna.consumer@test.com', 'Anna', 'Taylor', '+2348012345680', 'consumer', true),

-- Merchants
('merch_001', 'shell.station@test.com', 'Shell', 'Station', '+2348012345681', 'merchant', true),
('merch_002', 'total.fuel@test.com', 'Total', 'Energies', '+2348012345682', 'merchant', true),
('merch_003', 'shoprite.store@test.com', 'Shoprite', 'Supermarket', '+2348012345683', 'merchant', true),
('merch_004', 'game.stores@test.com', 'Game', 'Stores', '+2348012345684', 'merchant', true),
('merch_005', 'jumia.food@test.com', 'Jumia', 'Food', '+2348012345685', 'merchant', true),

-- Drivers
('driver_001', 'ade.driver@test.com', 'Adebayo', 'Ogunleye', '+2348012345686', 'driver', true),
('driver_002', 'chidi.driver@test.com', 'Chidi', 'Okeke', '+2348012345687', 'driver', true),
('driver_003', 'bola.driver@test.com', 'Bola', 'Ahmed', '+2348012345688', 'driver', true),
('driver_004', 'emeka.driver@test.com', 'Emeka', 'Eze', '+2348012345689', 'driver', true),
('driver_005', 'fatima.driver@test.com', 'Fatima', 'Hassan', '+2348012345690', 'driver', true);

-- Insert Merchants with realistic Abuja locations
INSERT INTO merchants (id, user_id, business_name, business_type, address, latitude, longitude, phone_number, email, rating, is_verified, is_open) VALUES
('merch_001', 'merch_001', 'Shell Jabi', 'fuel_station', 'Plot 123, Jabi District, Abuja', 9.0679, 7.4345, '+2348012345681', 'shell.jabi@test.com', 4.5, true, true),
('merch_002', 'merch_002', 'Total Gwarimpa', 'fuel_station', '45 Gwarimpa Estate, Abuja', 9.1103, 7.4114, '+2348012345682', 'total.gwarimpa@test.com', 4.2, true, true),
('merch_003', 'merch_003', 'Shoprite Jabi Lake Mall', 'supermarket', 'Jabi Lake Mall, Abuja', 9.0765, 7.4897, '+2348012345683', 'shoprite.jabi@test.com', 4.7, true, true),
('merch_004', 'merch_004', 'Game Ceddi Plaza', 'supermarket', 'Ceddi Plaza, Central Business District, Abuja', 9.0579, 7.4951, '+2348012345684', 'game.ceddi@test.com', 4.3, true, true),
('merch_005', 'merch_005', 'Jumia Food Wuse 2', 'restaurant', '15 Adetokunbo Ademola Crescent, Wuse 2, Abuja', 9.0643, 7.4820, '+2348012345685', 'jumia.wuse@test.com', 4.6, true, true);

-- Insert Commodities (50+ items across categories)
INSERT INTO commodities (id, merchant_id, name, description, category, price, unit, stock_quantity, image_url, is_available) VALUES
-- Fuel Products (10 items)
('comm_001', 'merch_001', 'Premium Motor Spirit (PMS)', 'High-quality petrol for all vehicles', 'fuel', 617.00, 'litre', 5000, 'https://example.com/pms.jpg', true),
('comm_002', 'merch_001', 'Automotive Gas Oil (AGO)', 'Diesel fuel for heavy vehicles', 'fuel', 720.00, 'litre', 3000, 'https://example.com/ago.jpg', true),
('comm_003', 'merch_001', 'Dual Purpose Kerosene (DPK)', 'Kerosene for cooking and lighting', 'fuel', 580.00, 'litre', 2000, 'https://example.com/dpk.jpg', true),
('comm_004', 'merch_002', 'Premium Motor Spirit (PMS)', 'Total branded petrol', 'fuel', 615.00, 'litre', 6000, 'https://example.com/total-pms.jpg', true),
('comm_005', 'merch_002', 'Automotive Gas Oil (AGO)', 'Total diesel', 'fuel', 715.00, 'litre', 4000, 'https://example.com/total-ago.jpg', true),
('comm_006', 'merch_001', 'Engine Oil 5W-30', 'Synthetic engine oil', 'fuel', 8500.00, 'bottle', 100, 'https://example.com/engine-oil.jpg', true),
('comm_007', 'merch_002', 'Engine Oil 10W-40', 'Semi-synthetic engine oil', 'fuel', 6500.00, 'bottle', 80, 'https://example.com/engine-oil-2.jpg', true),
('comm_008', 'merch_001', 'Brake Fluid', 'DOT 4 brake fluid', 'fuel', 2500.00, 'bottle', 50, 'https://example.com/brake-fluid.jpg', true),
('comm_009', 'merch_002', 'Coolant/Antifreeze', 'Engine coolant', 'fuel', 3500.00, 'bottle', 60, 'https://example.com/coolant.jpg', true),
('comm_010', 'merch_001', 'Windshield Washer Fluid', 'Glass cleaner fluid', 'fuel', 1200.00, 'bottle', 40, 'https://example.com/washer-fluid.jpg', true),

-- Groceries (20 items)
('comm_011', 'merch_003', 'Basmati Rice 5kg', 'Premium long grain rice', 'groceries', 7500.00, 'bag', 200, 'https://example.com/rice.jpg', true),
('comm_012', 'merch_003', 'Vegetable Oil 5L', 'Pure vegetable cooking oil', 'groceries', 12000.00, 'bottle', 150, 'https://example.com/oil.jpg', true),
('comm_013', 'merch_003', 'Sugar 2kg', 'Granulated white sugar', 'groceries', 2800.00, 'pack', 300, 'https://example.com/sugar.jpg', true),
('comm_014', 'merch_003', 'Salt 1kg', 'Iodized table salt', 'groceries', 450.00, 'pack', 250, 'https://example.com/salt.jpg', true),
('comm_015', 'merch_003', 'Tomato Paste 400g', 'Concentrated tomato paste', 'groceries', 850.00, 'can', 180, 'https://example.com/tomato-paste.jpg', true),
('comm_016', 'merch_004', 'Bread Loaf', 'Fresh white bread', 'groceries', 1200.00, 'loaf', 100, 'https://example.com/bread.jpg', true),
('comm_017', 'merch_004', 'Milk 1L', 'Fresh cow milk', 'groceries', 1500.00, 'carton', 80, 'https://example.com/milk.jpg', true),
('comm_018', 'merch_003', 'Eggs (Crate)', '30 pieces', 'groceries', 3500.00, 'crate', 50, 'https://example.com/eggs.jpg', true),
('comm_019', 'merch_003', 'Chicken 1kg', 'Fresh frozen chicken', 'groceries', 4200.00, 'kg', 120, 'https://example.com/chicken.jpg', true),
('comm_020', 'merch_004', 'Beef 1kg', 'Fresh beef cuts', 'groceries', 6500.00, 'kg', 90, 'https://example.com/beef.jpg', true),
('comm_021', 'merch_003', 'Onions 1kg', 'Fresh red onions', 'groceries', 1800.00, 'kg', 200, 'https://example.com/onions.jpg', true),
('comm_022', 'merch_003', 'Tomatoes 1kg', 'Fresh tomatoes', 'groceries', 2200.00, 'kg', 180, 'https://example.com/tomatoes.jpg', true),
('comm_023', 'merch_004', 'Potatoes 5kg', 'Irish potatoes', 'groceries', 4500.00, 'bag', 100, 'https://example.com/potatoes.jpg', true),
('comm_024', 'merch_003', 'Carrots 1kg', 'Fresh carrots', 'groceries', 1500.00, 'kg', 150, 'https://example.com/carrots.jpg', true),
('comm_025', 'merch_004', 'Green Beans 500g', 'Fresh green beans', 'groceries', 1200.00, 'pack', 80, 'https://example.com/green-beans.jpg', true),
('comm_026', 'merch_003', 'Spaghetti 500g', 'Durum wheat pasta', 'groceries', 950.00, 'pack', 200, 'https://example.com/spaghetti.jpg', true),
('comm_027', 'merch_004', 'Cornflakes 500g', 'Breakfast cereal', 'groceries', 2800.00, 'box', 100, 'https://example.com/cornflakes.jpg', true),
('comm_028', 'merch_003', 'Tea Bags 100pcs', 'Black tea', 'groceries', 1500.00, 'box', 120, 'https://example.com/tea.jpg', true),
('comm_029', 'merch_004', 'Coffee 200g', 'Instant coffee', 'groceries', 3500.00, 'jar', 90, 'https://example.com/coffee.jpg', true),
('comm_030', 'merch_003', 'Bottled Water 75cl', 'Pure drinking water', 'groceries', 250.00, 'bottle', 500, 'https://example.com/water.jpg', true),

-- Food/Restaurant Items (20 items)
('comm_031', 'merch_005', 'Jollof Rice', 'Nigerian jollof rice with chicken', 'food', 3500.00, 'plate', 50, 'https://example.com/jollof.jpg', true),
('comm_032', 'merch_005', 'Fried Rice', 'Special fried rice', 'food', 3200.00, 'plate', 50, 'https://example.com/fried-rice.jpg', true),
('comm_033', 'merch_005', 'Pounded Yam & Egusi', 'Traditional dish', 'food', 4500.00, 'plate', 40, 'https://example.com/pounded-yam.jpg', true),
('comm_034', 'merch_005', 'Amala & Ewedu', 'Yoruba delicacy', 'food', 3800.00, 'plate', 40, 'https://example.com/amala.jpg', true),
('comm_035', 'merch_005', 'Grilled Chicken', 'Half chicken grilled', 'food', 4200.00, 'serving', 30, 'https://example.com/grilled-chicken.jpg', true),
('comm_036', 'merch_005', 'Fried Chicken', '4 pieces', 'food', 3500.00, 'serving', 40, 'https://example.com/fried-chicken.jpg', true),
('comm_037', 'merch_005', 'Beef Burger', 'Classic beef burger with fries', 'food', 2800.00, 'piece', 60, 'https://example.com/burger.jpg', true),
('comm_038', 'merch_005', 'Chicken Burger', 'Grilled chicken burger', 'food', 2500.00, 'piece', 60, 'https://example.com/chicken-burger.jpg', true),
('comm_039', 'merch_005', 'Pepperoni Pizza 12"', 'Large pepperoni pizza', 'food', 8500.00, 'piece', 20, 'https://example.com/pizza.jpg', true),
('comm_040', 'merch_005', 'Margherita Pizza 12"', 'Classic cheese pizza', 'food', 7500.00, 'piece', 20, 'https://example.com/margherita.jpg', true),
('comm_041', 'merch_005', 'Shawarma Wrap', 'Chicken shawarma', 'food', 2000.00, 'wrap', 80, 'https://example.com/shawarma.jpg', true),
('comm_042', 'merch_005', 'Suya 500g', 'Spicy grilled meat', 'food', 3500.00, 'pack', 50, 'https://example.com/suya.jpg', true),
('comm_043', 'merch_005', 'Pepper Soup', 'Goat meat pepper soup', 'food', 4000.00, 'bowl', 30, 'https://example.com/pepper-soup.jpg', true),
('comm_044', 'merch_005', 'Eba & Okra Soup', 'Traditional meal', 'food', 3200.00, 'plate', 40, 'https://example.com/eba.jpg', true),
('comm_045', 'merch_005', 'Chinese Fried Rice', 'Special fried rice', 'food', 3800.00, 'plate', 40, 'https://example.com/chinese-rice.jpg', true),
('comm_046', 'merch_005', 'Spring Rolls (6pcs)', 'Vegetable spring rolls', 'food', 1800.00, 'serving', 50, 'https://example.com/spring-rolls.jpg', true),
('comm_047', 'merch_005', 'Ice Cream Sundae', 'Vanilla ice cream with toppings', 'food', 1500.00, 'cup', 60, 'https://example.com/ice-cream.jpg', true),
('comm_048', 'merch_005', 'Fresh Orange Juice', 'Freshly squeezed', 'food', 1200.00, 'glass', 100, 'https://example.com/orange-juice.jpg', true),
('comm_049', 'merch_005', 'Chapman', 'Local cocktail drink', 'food', 1500.00, 'glass', 80, 'https://example.com/chapman.jpg', true),
('comm_050', 'merch_005', 'Small Chops Platter', 'Assorted finger foods', 'food', 5500.00, 'platter', 25, 'https://example.com/small-chops.jpg', true);

-- Insert Sample Orders with various statuses
INSERT INTO orders (id, user_id, merchant_id, driver_id, total_amount, delivery_fee, status, delivery_address, delivery_latitude, delivery_longitude, payment_method, created_at) VALUES
('order_001', 'user_001', 'merch_001', 'driver_001', 30500.00, 500.00, 'delivered', '12 Maitama Street, Abuja', 9.0820, 7.4950, 'card', NOW() - INTERVAL '2 days'),
('order_002', 'user_002', 'merch_003', 'driver_002', 45200.00, 800.00, 'delivered', '45 Gwarimpa Estate, Abuja', 9.1103, 7.4114, 'card', NOW() - INTERVAL '1 day'),
('order_003', 'user_003', 'merch_005', 'driver_003', 12000.00, 600.00, 'in_transit', '78 Wuse 2, Abuja', 9.0643, 7.4820, 'cash', NOW() - INTERVAL '2 hours'),
('order_004', 'user_001', 'merch_002', NULL, 25000.00, 500.00, 'confirmed', '12 Maitama Street, Abuja', 9.0820, 7.4950, 'card', NOW() - INTERVAL '30 minutes'),
('order_005', 'user_004', 'merch_004', NULL, 18500.00, 700.00, 'pending', '90 Asokoro, Abuja', 9.0333, 7.5333, 'card', NOW() - INTERVAL '10 minutes');

-- Insert Order Items
INSERT INTO order_items (order_id, commodity_id, quantity, price) VALUES
('order_001', 'comm_001', 50, 617.00),
('order_002', 'comm_011', 5, 7500.00),
('order_002', 'comm_012', 1, 12000.00),
('order_003', 'comm_031', 2, 3500.00),
('order_003', 'comm_037', 2, 2800.00),
('order_004', 'comm_004', 40, 615.00),
('order_005', 'comm_019', 3, 4200.00),
('order_005', 'comm_021', 2, 1800.00);

-- Insert Driver Locations (for real-time tracking)
INSERT INTO driver_locations (driver_id, latitude, longitude, heading, speed) VALUES
('driver_001', 9.0765, 7.4897, 90, 45.5),
('driver_002', 9.0679, 7.4345, 180, 30.2),
('driver_003', 9.0643, 7.4820, 270, 50.8),
('driver_004', 9.1103, 7.4114, 45, 35.0),
('driver_005', 9.0579, 7.4951, 135, 40.5);

-- Insert some cart items for active users
INSERT INTO cart_items (user_id, commodity_id, quantity) VALUES
('user_005', 'comm_031', 1),
('user_005', 'comm_032', 1),
('user_006', 'comm_001', 30),
('user_007', 'comm_011', 2);

COMMIT;
