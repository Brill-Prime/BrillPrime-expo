-- Enhanced Comprehensive Test Data for Brill Prime
-- Run this after schema.sql and all missing tables

-- Clear existing data (in correct order to avoid FK conflicts)
TRUNCATE TABLE 
  review_responses, review_votes, reviews, 
  withdrawal_requests, wallet_balances, transactions,
  kyc_documents, addresses, payment_methods,
  order_locations, delivery_zones, drivers,
  messages, conversations, 
  order_items, orders, cart_items, 
  products, merchants, users,
  user_privacy_settings,
  data_deletion_requests, data_export_requests
CASCADE;

-- Insert Test Users (20 consumers, 10 merchants, 10 drivers, 2 admins)
INSERT INTO users (id, firebase_uid, email, full_name, role, phone_number, profile_image_url, is_verified, is_active) VALUES
-- Consumers (20)
('user_001', 'firebase_uid_user_001', 'john.consumer@test.com', 'John Doe', 'consumer', '+2348012345671', 'https://example.com/profile1.jpg', true, true),
('user_002', 'firebase_uid_user_002', 'jane.consumer@test.com', 'Jane Smith', 'consumer', '+2348012345672', 'https://example.com/profile2.jpg', true, true),
('user_003', 'firebase_uid_user_003', 'mike.consumer@test.com', 'Mike Johnson', 'consumer', '+2348012345673', 'https://example.com/profile3.jpg', true, true),
('user_004', 'firebase_uid_user_004', 'sarah.consumer@test.com', 'Sarah Williams', 'consumer', '+2348012345674', 'https://example.com/profile4.jpg', true, true),
('user_005', 'firebase_uid_user_005', 'david.consumer@test.com', 'David Brown', 'consumer', '+2348012345675', 'https://example.com/profile5.jpg', true, true),
('user_006', 'firebase_uid_user_006', 'emily.consumer@test.com', 'Emily Davis', 'consumer', '+2348012345676', 'https://example.com/profile6.jpg', true, true),
('user_007', 'firebase_uid_user_007', 'chris.consumer@test.com', 'Chris Miller', 'consumer', '+2348012345677', 'https://example.com/profile7.jpg', true, true),
('user_008', 'firebase_uid_user_008', 'lisa.consumer@test.com', 'Lisa Wilson', 'consumer', '+2348012345678', 'https://example.com/profile8.jpg', true, true),
('user_009', 'firebase_uid_user_009', 'james.consumer@test.com', 'James Moore', 'consumer', '+2348012345679', 'https://example.com/profile9.jpg', true, true),
('user_010', 'firebase_uid_user_010', 'anna.consumer@test.com', 'Anna Taylor', 'consumer', '+2348012345680', 'https://example.com/profile10.jpg', true, true),
('user_011', 'firebase_uid_user_011', 'michael.consumer@test.com', 'Michael Anderson', 'consumer', '+2348012345681', 'https://example.com/profile11.jpg', true, true),
('user_012', 'firebase_uid_user_012', 'sophia.consumer@test.com', 'Sophia Thomas', 'consumer', '+2348012345682', 'https://example.com/profile12.jpg', true, true),
('user_013', 'firebase_uid_user_013', 'daniel.consumer@test.com', 'Daniel Jackson', 'consumer', '+2348012345683', 'https://example.com/profile13.jpg', true, true),
('user_014', 'firebase_uid_user_014', 'olivia.consumer@test.com', 'Olivia White', 'consumer', '+2348012345684', 'https://example.com/profile14.jpg', true, true),
('user_015', 'firebase_uid_user_015', 'william.consumer@test.com', 'William Harris', 'consumer', '+2348012345685', 'https://example.com/profile15.jpg', true, true),
('user_016', 'firebase_uid_user_016', 'ava.consumer@test.com', 'Ava Martin', 'consumer', '+2348012345686', 'https://example.com/profile16.jpg', true, true),
('user_017', 'firebase_uid_user_017', 'alexander.consumer@test.com', 'Alexander Thompson', 'consumer', '+2348012345687', 'https://example.com/profile17.jpg', true, true),
('user_018', 'firebase_uid_user_018', 'mia.consumer@test.com', 'Mia Garcia', 'consumer', '+2348012345688', 'https://example.com/profile18.jpg', true, true),
('user_019', 'firebase_uid_user_019', 'ethan.consumer@test.com', 'Ethan Martinez', 'consumer', '+2348012345689', 'https://example.com/profile19.jpg', true, true),
('user_020', 'firebase_uid_user_020', 'isabella.consumer@test.com', 'Isabella Robinson', 'consumer', '+2348012345690', 'https://example.com/profile20.jpg', true, true),

-- Merchants (10)
('merch_001', 'firebase_uid_merch_001', 'shell.station@test.com', 'Shell Station', 'merchant', '+2348012345691', 'https://example.com/merchant1.jpg', true, true),
('merch_002', 'firebase_uid_merch_002', 'total.fuel@test.com', 'Total Energies', 'merchant', '+2348012345692', 'https://example.com/merchant2.jpg', true, true),
('merch_003', 'firebase_uid_merch_003', 'shoprite.store@test.com', 'Shoprite Supermarket', 'merchant', '+2348012345693', 'https://example.com/merchant3.jpg', true, true),
('merch_004', 'firebase_uid_merch_004', 'game.stores@test.com', 'Game Stores', 'merchant', '+2348012345694', 'https://example.com/merchant4.jpg', true, true),
('merch_005', 'firebase_uid_merch_005', 'jumia.food@test.com', 'Jumia Food', 'merchant', '+2348012345695', 'https://example.com/merchant5.jpg', true, true),
('merch_006', 'firebase_uid_merch_006', 'dominos.pizza@test.com', 'Domino''s Pizza', 'merchant', '+2348012345696', 'https://example.com/merchant6.jpg', true, true),
('merch_007', 'firebase_uid_merch_007', 'kfc.restaurant@test.com', 'KFC Restaurant', 'merchant', '+2348012345697', 'https://example.com/merchant7.jpg', true, true),
('merch_008', 'firebase_uid_merch_008', 'ikea.furniture@test.com', 'IKEA Furniture', 'merchant', '+2348012345698', 'https://example.com/merchant8.jpg', true, true),
('merch_009', 'firebase_uid_merch_009', 'apple.store@test.com', 'Apple Store', 'merchant', '+2348012345699', 'https://example.com/merchant9.jpg', true, true),
('merch_010', 'firebase_uid_merch_010', 'pharmacyplus@test.com', 'Pharmacy Plus', 'merchant', '+2348012345700', 'https://example.com/merchant10.jpg', true, true),

-- Drivers (10)
('driver_001', 'firebase_uid_driver_001', 'ade.driver@test.com', 'Adebayo Ogunleye', 'driver', '+2348012345701', 'https://example.com/driver1.jpg', true, true),
('driver_002', 'firebase_uid_driver_002', 'chidi.driver@test.com', 'Chidi Okeke', 'driver', '+2348012345702', 'https://example.com/driver2.jpg', true, true),
('driver_003', 'firebase_uid_driver_003', 'bola.driver@test.com', 'Bola Ahmed', 'driver', '+2348012345703', 'https://example.com/driver3.jpg', true, true),
('driver_004', 'firebase_uid_driver_004', 'emeka.driver@test.com', 'Emeka Eze', 'driver', '+2348012345704', 'https://example.com/driver4.jpg', true, true),
('driver_005', 'firebase_uid_driver_005', 'fatima.driver@test.com', 'Fatima Hassan', 'driver', '+2348012345705', 'https://example.com/driver5.jpg', true, true),
('driver_006', 'firebase_uid_driver_006', 'umar.driver@test.com', 'Umar Abdullahi', 'driver', '+2348012345706', 'https://example.com/driver6.jpg', true, true),
('driver_007', 'firebase_uid_driver_007', 'amina.driver@test.com', 'Amina Yusuf', 'driver', '+2348012345707', 'https://example.com/driver7.jpg', true, true),
('driver_008', 'firebase_uid_driver_008', 'ibrahim.driver@test.com', 'Ibrahim Musa', 'driver', '+2348012345708', 'https://example.com/driver8.jpg', true, true),
('driver_009', 'firebase_uid_driver_009', 'hassan.driver@test.com', 'Hassan Ali', 'driver', '+2348012345709', 'https://example.com/driver9.jpg', true, true),
('driver_010', 'firebase_uid_driver_010', 'maryam.driver@test.com', 'Maryam Mohammed', 'driver', '+2348012345710', 'https://example.com/driver10.jpg', true, true),

-- Admins (2)
('admin_001', 'firebase_uid_admin_001', 'admin.one@test.com', 'Admin One', 'admin', '+2348012345711', 'https://example.com/admin1.jpg', true, true),
('admin_002', 'firebase_uid_admin_002', 'admin.two@test.com', 'Admin Two', 'admin', '+2348012345712', 'https://example.com/admin2.jpg', true, true);

-- Insert Merchants with realistic Abuja locations
INSERT INTO merchants (id, user_id, business_name, business_type, location, address, city, state, country, rating, total_reviews, is_verified, is_active) VALUES
('merch_001', 'merch_001', 'Shell Jabi', 'fuel_station', ST_GeogFromText('POINT(7.4345 9.0679)'), 'Plot 123, Jabi District, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.5, 120, true, true),
('merch_002', 'merch_002', 'Total Gwarimpa', 'fuel_station', ST_GeogFromText('POINT(7.4114 9.1103)'), '45 Gwarimpa Estate, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.2, 95, true, true),
('merch_003', 'merch_003', 'Shoprite Jabi Lake Mall', 'supermarket', ST_GeogFromText('POINT(7.4897 9.0765)'), 'Jabi Lake Mall, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.7, 210, true, true),
('merch_004', 'merch_004', 'Game Ceddi Plaza', 'supermarket', ST_GeogFromText('POINT(7.4951 9.0579)'), 'Ceddi Plaza, Central Business District, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.3, 180, true, true),
('merch_005', 'merch_005', 'Jumia Food Wuse 2', 'restaurant', ST_GeogFromText('POINT(7.4820 9.0643)'), '15 Adetokunbo Ademola Crescent, Wuse 2, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.6, 320, true, true),
('merch_006', 'merch_006', 'Domino''s Pizza Garki', 'restaurant', ST_GeogFromText('POINT(7.4290 9.0420)'), '12 Garki District, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.4, 150, true, true),
('merch_007', 'merch_007', 'KFC Wuse', 'restaurant', ST_GeogFromText('POINT(7.4780 9.0550)'), 'Wuse Shopping Centre, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.1, 140, true, true),
('merch_008', 'merch_008', 'IKEA Abuja', 'furniture_store', ST_GeogFromText('POINT(7.5100 9.0800)'), 'Area 10, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.8, 90, true, true),
('merch_009', 'merch_009', 'Apple Store Central Park', 'electronics_store', ST_GeogFromText('POINT(7.4350 9.0400)'), 'Central Park Mall, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.9, 200, true, true),
('merch_010', 'merch_010', 'Pharmacy Plus Life Camp', 'pharmacy', ST_GeogFromText('POINT(7.4000 9.0200)'), 'Life Camp Market, Abuja', 'Abuja', 'FCT', 'Nigeria', 4.5, 110, true, true);

-- Insert Drivers
INSERT INTO drivers (id, user_id, vehicle_type, vehicle_model, vehicle_plate, license_number, license_expiry, is_available, is_verified, rating, total_deliveries) VALUES
('driver_001', 'driver_001', 'motorcycle', 'Yamaha FZ-S', 'ABJ-123-XY', 'DL1234567890', '2026-12-31', true, true, 4.8, 150),
('driver_002', 'driver_002', 'motorcycle', 'Honda CB Hornet', 'ABJ-234-YZ', 'DL2345678901', '2026-11-30', true, true, 4.6, 120),
('driver_003', 'driver_003', 'car', 'Toyota Corolla', 'ABJ-345-ZA', 'DL3456789012', '2027-01-15', true, true, 4.7, 180),
('driver_004', 'driver_004', 'motorcycle', 'Suzuki Gixxer', 'ABJ-456-AB', 'DL4567890123', '2026-10-20', true, true, 4.5, 95),
('driver_005', 'driver_005', 'car', 'Hyundai Elantra', 'ABJ-567-BC', 'DL5678901234', '2027-03-10', true, true, 4.9, 210),
('driver_006', 'driver_006', 'motorcycle', 'KTM Duke 200', 'ABJ-678-CD', 'DL6789012345', '2026-09-05', true, true, 4.4, 85),
('driver_007', 'driver_007', 'car', 'Honda Civic', 'ABJ-789-DE', 'DL7890123456', '2027-05-22', true, true, 4.6, 165),
('driver_008', 'driver_008', 'motorcycle', 'Bajaj Pulsar NS200', 'ABJ-890-EF', 'DL8901234567', '2026-08-18', true, true, 4.3, 75),
('driver_009', 'driver_009', 'van', 'Nissan NV200', 'ABJ-901-FG', 'DL9012345678', '2027-02-28', true, true, 4.7, 195),
('driver_010', 'driver_010', 'motorcycle', 'Royal Enfield Classic 350', 'ABJ-012-GH', 'DL0123456789', '2026-07-12', true, true, 4.8, 140);

-- Insert Products/Commodities (100+ items across categories)
INSERT INTO products (id, merchant_id, name, description, category, unit, price, stock_quantity, image_url, is_available) VALUES
-- Fuel Products (15 items)
('prod_001', 'merch_001', 'Premium Motor Spirit (PMS)', 'High-quality petrol for all vehicles', 'fuel', 'litre', 617.00, 5000, 'https://example.com/pms.jpg', true),
('prod_002', 'merch_001', 'Automotive Gas Oil (AGO)', 'Diesel fuel for heavy vehicles', 'fuel', 'litre', 720.00, 3000, 'https://example.com/ago.jpg', true),
('prod_003', 'merch_001', 'Dual Purpose Kerosene (DPK)', 'Kerosene for cooking and lighting', 'fuel', 'litre', 580.00, 2000, 'https://example.com/dpk.jpg', true),
('prod_004', 'merch_002', 'Premium Motor Spirit (PMS)', 'Total branded petrol', 'fuel', 'litre', 615.00, 6000, 'https://example.com/total-pms.jpg', true),
('prod_005', 'merch_002', 'Automotive Gas Oil (AGO)', 'Total diesel', 'fuel', 'litre', 715.00, 4000, 'https://example.com/total-ago.jpg', true),
('prod_006', 'merch_001', 'Engine Oil 5W-30', 'Synthetic engine oil', 'fuel', 'bottle', 8500.00, 100, 'https://example.com/engine-oil.jpg', true),
('prod_007', 'merch_002', 'Engine Oil 10W-40', 'Semi-synthetic engine oil', 'fuel', 'bottle', 6500.00, 80, 'https://example.com/engine-oil-2.jpg', true),
('prod_008', 'merch_001', 'Brake Fluid', 'DOT 4 brake fluid', 'fuel', 'bottle', 2500.00, 50, 'https://example.com/brake-fluid.jpg', true),
('prod_009', 'merch_002', 'Coolant/Antifreeze', 'Engine coolant', 'fuel', 'bottle', 3500.00, 60, 'https://example.com/coolant.jpg', true),
('prod_010', 'merch_001', 'Windshield Washer Fluid', 'Glass cleaner fluid', 'fuel', 'bottle', 1200.00, 40, 'https://example.com/washer-fluid.jpg', true),
('prod_011', 'merch_002', 'Transmission Fluid', 'Automatic transmission fluid', 'fuel', 'bottle', 4200.00, 35, 'https://example.com/transmission-fluid.jpg', true),
('prod_012', 'merch_001', 'Power Steering Fluid', 'Hydraulic fluid for power steering', 'fuel', 'bottle', 3800.00, 30, 'https://example.com/steering-fluid.jpg', true),
('prod_013', 'merch_002', 'Gear Oil 80W-90', 'Heavy-duty gear lubricant', 'fuel', 'bottle', 4500.00, 25, 'https://example.com/gear-oil.jpg', true),
('prod_014', 'merch_001', 'Fuel Additive', 'Petrol additive for engine cleaning', 'fuel', 'bottle', 2200.00, 70, 'https://example.com/fuel-additive.jpg', true),
('prod_015', 'merch_002', 'Diesel Additive', 'Diesel additive for improved combustion', 'fuel', 'bottle', 2400.00, 65, 'https://example.com/diesel-additive.jpg', true),

-- Groceries (30 items)
('prod_016', 'merch_003', 'Basmati Rice 5kg', 'Premium long grain rice', 'groceries', 'bag', 7500.00, 200, 'https://example.com/rice.jpg', true),
('prod_017', 'merch_003', 'Vegetable Oil 5L', 'Pure vegetable cooking oil', 'groceries', 'bottle', 12000.00, 150, 'https://example.com/oil.jpg', true),
('prod_018', 'merch_003', 'Sugar 2kg', 'Granulated white sugar', 'groceries', 'pack', 2800.00, 300, 'https://example.com/sugar.jpg', true),
('prod_019', 'merch_003', 'Salt 1kg', 'Iodized table salt', 'groceries', 'pack', 450.00, 250, 'https://example.com/salt.jpg', true),
('prod_020', 'merch_003', 'Tomato Paste 400g', 'Concentrated tomato paste', 'groceries', 'can', 850.00, 180, 'https://example.com/tomato-paste.jpg', true),
('prod_021', 'merch_004', 'Bread Loaf', 'Fresh white bread', 'groceries', 'loaf', 1200.00, 100, 'https://example.com/bread.jpg', true),
('prod_022', 'merch_004', 'Milk 1L', 'Fresh cow milk', 'groceries', 'carton', 1500.00, 80, 'https://example.com/milk.jpg', true),
('prod_023', 'merch_003', 'Eggs (Crate)', '30 pieces', 'groceries', 'crate', 3500.00, 50, 'https://example.com/eggs.jpg', true),
('prod_024', 'merch_003', 'Chicken 1kg', 'Fresh frozen chicken', 'groceries', 'kg', 4200.00, 120, 'https://example.com/chicken.jpg', true),
('prod_025', 'merch_004', 'Beef 1kg', 'Fresh beef cuts', 'groceries', 'kg', 6500.00, 90, 'https://example.com/beef.jpg', true),
('prod_026', 'merch_003', 'Onions 1kg', 'Fresh red onions', 'groceries', 'kg', 1800.00, 200, 'https://example.com/onions.jpg', true),
('prod_027', 'merch_003', 'Tomatoes 1kg', 'Fresh tomatoes', 'groceries', 'kg', 2200.00, 180, 'https://example.com/tomatoes.jpg', true),
('prod_028', 'merch_004', 'Potatoes 5kg', 'Irish potatoes', 'groceries', 'bag', 4500.00, 100, 'https://example.com/potatoes.jpg', true),
('prod_029', 'merch_003', 'Carrots 1kg', 'Fresh carrots', 'groceries', 'kg', 1500.00, 150, 'https://example.com/carrots.jpg', true),
('prod_030', 'merch_004', 'Green Beans 500g', 'Fresh green beans', 'groceries', 'pack', 1200.00, 80, 'https://example.com/green-beans.jpg', true),
('prod_031', 'merch_003', 'Spaghetti 500g', 'Durum wheat pasta', 'groceries', 'pack', 950.00, 200, 'https://example.com/spaghetti.jpg', true),
('prod_032', 'merch_004', 'Cornflakes 500g', 'Breakfast cereal', 'groceries', 'box', 2800.00, 100, 'https://example.com/cornflakes.jpg', true),
('prod_033', 'merch_003', 'Tea Bags 100pcs', 'Black tea', 'groceries', 'box', 1500.00, 120, 'https://example.com/tea.jpg', true),
('prod_034', 'merch_004', 'Coffee 200g', 'Instant coffee', 'groceries', 'jar', 3500.00, 90, 'https://example.com/coffee.jpg', true),
('prod_035', 'merch_003', 'Bottled Water 75cl', 'Pure drinking water', 'groceries', 'bottle', 250.00, 500, 'https://example.com/water.jpg', true),
('prod_036', 'merch_003', 'Bananas 1kg', 'Fresh ripe bananas', 'groceries', 'kg', 1200.00, 150, 'https://example.com/bananas.jpg', true),
('prod_037', 'merch_004', 'Apples 1kg', 'Fresh red apples', 'groceries', 'kg', 2500.00, 100, 'https://example.com/apples.jpg', true),
('prod_038', 'merch_003', 'Oranges 1kg', 'Fresh sweet oranges', 'groceries', 'kg', 1800.00, 120, 'https://example.com/oranges.jpg', true),
('prod_039', 'merch_004', 'Garlic 200g', 'Fresh garlic bulbs', 'groceries', 'pack', 800.00, 80, 'https://example.com/garlic.jpg', true),
('prod_040', 'merch_003', 'Ginger 200g', 'Fresh ginger root', 'groceries', 'pack', 600.00, 90, 'https://example.com/ginger.jpg', true),
('prod_041', 'merch_004', 'Pepper (Bell) 500g', 'Fresh bell peppers', 'groceries', 'pack', 1500.00, 70, 'https://example.com/bell-pepper.jpg', true),
('prod_042', 'merch_003', 'Cucumber 1kg', 'Fresh cucumbers', 'groceries', 'kg', 1000.00, 100, 'https://example.com/cucumber.jpg', true),
('prod_043', 'merch_004', 'Lettuce 1 head', 'Fresh iceberg lettuce', 'groceries', 'head', 800.00, 60, 'https://example.com/lettuce.jpg', true),
('prod_044', 'merch_003', 'Cabbage 1kg', 'Fresh green cabbage', 'groceries', 'kg', 900.00, 80, 'https://example.com/cabbage.jpg', true),
('prod_045', 'merch_004', 'Spinach 500g', 'Fresh baby spinach', 'groceries', 'pack', 1200.00, 70, 'https://example.com/spinach.jpg', true),

-- Food/Restaurant Items (30 items)
('prod_046', 'merch_005', 'Jollof Rice', 'Nigerian jollof rice with chicken', 'food', 'plate', 3500.00, 50, 'https://example.com/jollof.jpg', true),
('prod_047', 'merch_005', 'Fried Rice', 'Special fried rice', 'food', 'plate', 3200.00, 50, 'https://example.com/fried-rice.jpg', true),
('prod_048', 'merch_005', 'Pounded Yam & Egusi', 'Traditional dish', 'food', 'plate', 4500.00, 40, 'https://example.com/pounded-yam.jpg', true),
('prod_049', 'merch_005', 'Amala & Ewedu', 'Yoruba delicacy', 'food', 'plate', 3800.00, 40, 'https://example.com/amala.jpg', true),
('prod_050', 'merch_005', 'Grilled Chicken', 'Half chicken grilled', 'food', 'serving', 4200.00, 30, 'https://example.com/grilled-chicken.jpg', true),
('prod_051', 'merch_005', 'Fried Chicken', '4 pieces', 'food', 'serving', 3500.00, 40, 'https://example.com/fried-chicken.jpg', true),
('prod_052', 'merch_005', 'Beef Burger', 'Classic beef burger with fries', 'food', 'piece', 2800.00, 60, 'https://example.com/burger.jpg', true),
('prod_053', 'merch_005', 'Chicken Burger', 'Grilled chicken burger', 'food', 'piece', 2500.00, 60, 'https://example.com/chicken-burger.jpg', true),
('prod_054', 'merch_005', 'Pepperoni Pizza 12"', 'Large pepperoni pizza', 'food', 'piece', 8500.00, 20, 'https://example.com/pizza.jpg', true),
('prod_055', 'merch_005', 'Margherita Pizza 12"', 'Classic cheese pizza', 'food', 'piece', 7500.00, 20, 'https://example.com/margherita.jpg', true),
('prod_056', 'merch_005', 'Shawarma Wrap', 'Chicken shawarma', 'food', 'wrap', 2000.00, 80, 'https://example.com/shawarma.jpg', true),
('prod_057', 'merch_005', 'Suya 500g', 'Spicy grilled meat', 'food', 'pack', 3500.00, 50, 'https://example.com/suya.jpg', true),
('prod_058', 'merch_005', 'Pepper Soup', 'Goat meat pepper soup', 'food', 'bowl', 4000.00, 30, 'https://example.com/pepper-soup.jpg', true),
('prod_059', 'merch_005', 'Eba & Okra Soup', 'Traditional meal', 'food', 'plate', 3200.00, 40, 'https://example.com/eba.jpg', true),
('prod_060', 'merch_005', 'Chinese Fried Rice', 'Special fried rice', 'food', 'plate', 3800.00, 40, 'https://example.com/chinese-rice.jpg', true),
('prod_061', 'merch_005', 'Spring Rolls (6pcs)', 'Vegetable spring rolls', 'food', 'serving', 1800.00, 50, 'https://example.com/spring-rolls.jpg', true),
('prod_062', 'merch_005', 'Ice Cream Sundae', 'Vanilla ice cream with toppings', 'food', 'cup', 1500.00, 60, 'https://example.com/ice-cream.jpg', true),
('prod_063', 'merch_005', 'Fresh Orange Juice', 'Freshly squeezed', 'food', 'glass', 1200.00, 100, 'https://example.com/orange-juice.jpg', true),
('prod_064', 'merch_005', 'Chapman', 'Local cocktail drink', 'food', 'glass', 1500.00, 80, 'https://example.com/chapman.jpg', true),
('prod_065', 'merch_005', 'Small Chops Platter', 'Assorted finger foods', 'food', 'platter', 5500.00, 25, 'https://example.com/small-chops.jpg', true),
('prod_066', 'merch_006', 'Pepperoni Pizza Slice', 'Single slice of pepperoni pizza', 'food', 'slice', 1200.00, 100, 'https://example.com/pizza-slice.jpg', true),
('prod_067', 'merch_006', 'Margherita Pizza Slice', 'Single slice of margherita pizza', 'food', 'slice', 1000.00, 100, 'https://example.com/margherita-slice.jpg', true),
('prod_068', 'merch_006', 'Garlic Breadsticks', 'Freshly baked garlic breadsticks', 'food', 'serving', 800.00, 80, 'https://example.com/garlic-bread.jpg', true),
('prod_069', 'merch_006', 'Chicken Wings (6pcs)', 'Spicy buffalo wings', 'food', 'serving', 3200.00, 50, 'https://example.com/chicken-wings.jpg', true),
('prod_070', 'merch_006', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 'food', 'bowl', 2500.00, 60, 'https://example.com/caesar-salad.jpg', true),
('prod_071', 'merch_007', 'Original Recipe Chicken (2pcs)', 'KFC signature fried chicken', 'food', 'serving', 2800.00, 70, 'https://example.com/kfc-chicken.jpg', true),
('prod_072', 'merch_007', 'Zinger Burger', 'Spicy chicken zinger burger', 'food', 'piece', 2200.00, 80, 'https://example.com/zinger-burger.jpg', true),
('prod_073', 'merch_007', 'Popcorn Chicken', 'Bite-sized fried chicken pieces', 'food', 'box', 1800.00, 90, 'https://example.com/popcorn-chicken.jpg', true),
('prod_074', 'merch_007', 'Coleslaw', 'Creamy coleslaw side dish', 'food', 'cup', 500.00, 100, 'https://example.com/coleslaw.jpg', true),
('prod_075', 'merch_007', 'Mashed Potatoes', 'Creamy mashed potatoes with gravy', 'food', 'cup', 600.00, 90, 'https://example.com/mashed-potatoes.jpg', true),

-- Electronics (15 items)
('prod_076', 'merch_009', 'iPhone 15 Pro', 'Latest Apple smartphone', 'electronics', 'piece', 450000.00, 20, 'https://example.com/iphone15pro.jpg', true),
('prod_077', 'merch_009', 'Samsung Galaxy S24', 'Latest Samsung smartphone', 'electronics', 'piece', 380000.00, 25, 'https://example.com/galaxys24.jpg', true),
('prod_078', 'merch_009', 'MacBook Air M2', 'Lightweight Apple laptop', 'electronics', 'piece', 550000.00, 15, 'https://example.com/macbookair.jpg', true),
('prod_079', 'merch_009', 'iPad Pro 12.9"', 'Professional tablet with M2 chip', 'electronics', 'piece', 320000.00, 18, 'https://example.com/ipadpro.jpg', true),
('prod_080', 'merch_009', 'AirPods Pro 2nd Gen', 'Wireless earbuds with noise cancellation', 'electronics', 'pair', 95000.00, 40, 'https://example.com/airpodspro.jpg', true),
('prod_081', 'merch_009', 'Apple Watch Series 9', 'Smartwatch with health features', 'electronics', 'piece', 180000.00, 25, 'https://example.com/applewatch.jpg', true),
('prod_082', 'merch_009', 'Sony WH-1000XM5', 'Noise-canceling headphones', 'electronics', 'pair', 120000.00, 30, 'https://example.com/sonyheadphones.jpg', true),
('prod_083', 'merch_009', 'Nintendo Switch OLED', 'Gaming console with OLED screen', 'electronics', 'piece', 150000.00, 20, 'https://example.com/nintendoswitch.jpg', true),
('prod_084', 'merch_009', 'PlayStation 5', 'Next-gen gaming console', 'electronics', 'piece', 250000.00, 15, 'https://example.com/ps5.jpg', true),
('prod_085', 'merch_009', 'Xbox Series X', 'Microsoft gaming console', 'electronics', 'piece', 230000.00, 18, 'https://example.com/xboxseriesx.jpg', true),
('prod_086', 'merch_009', 'Canon EOS R8', 'Full-frame mirrorless camera', 'electronics', 'piece', 420000.00, 10, 'https://example.com/canoncamera.jpg', true),
('prod_087', 'merch_009', 'DJI Mini 3 Pro', 'Foldable drone with 4K camera', 'electronics', 'piece', 350000.00, 12, 'https://example.com/djidrone.jpg', true),
('prod_088', 'merch_009', 'GoPro Hero 12 Black', 'Action camera for adventures', 'electronics', 'piece', 180000.00, 20, 'https://example.com/gopro.jpg', true),
('prod_089', 'merch_009', 'Fitbit Charge 6', 'Fitness tracker with health metrics', 'electronics', 'piece', 85000.00, 30, 'https://example.com/fitbit.jpg', true),
('prod_090', 'merch_009', 'Logitech MX Master 3S', 'Wireless mouse for professionals', 'electronics', 'piece', 35000.00, 40, 'https://example.com/logitechmouse.jpg', true),

-- Furniture (10 items)
('prod_091', 'merch_008', 'IKEA POÄNG Chair', 'Comfortable armchair with cushion', 'furniture', 'piece', 45000.00, 25, 'https://example.com/poang-chair.jpg', true),
('prod_092', 'merch_008', 'IKEA MALM Bed Frame', 'Queen-size bed frame with storage', 'furniture', 'piece', 95000.00, 15, 'https://example.com/malm-bed.jpg', true),
('prod_093', 'merch_008', 'IKEA BILLY Bookcase', 'Classic bookshelf with 5 compartments', 'furniture', 'piece', 35000.00, 30, 'https://example.com/billy-bookcase.jpg', true),
('prod_094', 'merch_008', 'IKEA EKTORP Sofa', '3-seat sofa with removable covers', 'furniture', 'piece', 180000.00, 12, 'https://example.com/ektorp-sofa.jpg', true),
('prod_095', 'merch_008', 'IKEA IVAR Cabinet', 'Adjustable shelving unit', 'furniture', 'piece', 25000.00, 20, 'https://example.com/ivar-cabinet.jpg', true),
('prod_096', 'merch_008', 'IKEA KLIPPAN Loveseat', '2-seat sofa perfect for small spaces', 'furniture', 'piece', 75000.00, 18, 'https://example.com/klippan-loveseat.jpg', true),
('prod_097', 'merch_008', 'IKEA HEMNES Dresser', '6-drawer chest with solid wood', 'furniture', 'piece', 120000.00, 15, 'https://example.com/hemnes-dresser.jpg', true),
('prod_098', 'merch_008', 'IKEA LACK Side Table', 'Simple and affordable side table', 'furniture', 'piece', 15000.00, 40, 'https://example.com/lack-table.jpg', true),
('prod_099', 'merch_008', 'IKEA RÅSKOG Utility Cart', 'Mobile kitchen cart with 3 shelves', 'furniture', 'piece', 28000.00, 25, 'https://example.com/raskog-cart.jpg', true),
('prod_100', 'merch_008', 'IKEA SKADIS Pegboard', 'Flexible pegboard for organizing', 'furniture', 'piece', 22000.00, 30, 'https://example.com/skadis-pegboard.jpg', true),

-- Pharmacy/Medicine (10 items)
('prod_101', 'merch_010', 'Paracetamol 500mg (20 tabs)', 'Pain reliever and fever reducer', 'medicine', 'pack', 500.00, 200, 'https://example.com/paracetamol.jpg', true),
('prod_102', 'merch_010', 'Ibuprofen 400mg (20 tabs)', 'Anti-inflammatory painkiller', 'medicine', 'pack', 800.00, 150, 'https://example.com/ibuprofen.jpg', true),
('prod_103', 'merch_010', 'Vitamin C 1000mg (30 tabs)', 'Immune system booster', 'medicine', 'pack', 2500.00, 100, 'https://example.com/vitamin-c.jpg', true),
('prod_104', 'merch_010', 'Multivitamin (60 caps)', 'Daily multivitamin supplement', 'medicine', 'bottle', 4500.00, 80, 'https://example.com/multivitamin.jpg', true),
('prod_105', 'merch_010', 'Calcium + Vitamin D3 (60 tabs)', 'Bone health supplement', 'medicine', 'bottle', 3800.00, 90, 'https://example.com/calcium.jpg', true),
('prod_106', 'merch_010', 'Antacid Tablets (20 tabs)', 'Heartburn and indigestion relief', 'medicine', 'pack', 1200.00, 120, 'https://example.com/antacid.jpg', true),
('prod_107', 'merch_010', 'Cough Syrup 100ml', 'Relief for dry and wet coughs', 'medicine', 'bottle', 1800.00, 70, 'https://example.com/cough-syrup.jpg', true),
('prod_108', 'merch_010', 'First Aid Kit', 'Basic medical supplies kit', 'medicine', 'kit', 8500.00, 40, 'https://example.com/first-aid.jpg', true),
('prod_109', 'merch_010', 'Hand Sanitizer 500ml', 'Alcohol-based hand sanitizer', 'medicine', 'bottle', 1500.00, 150, 'https://example.com/hand-sanitizer.jpg', true),
('prod_110', 'merch_010', 'Face Mask (50 pcs)', 'Disposable face masks', 'medicine', 'pack', 3500.00, 60, 'https://example.com/face-mask.jpg', true);

-- Insert Sample Orders with various statuses
INSERT INTO orders (id, user_id, merchant_id, driver_id, status, total_amount, subtotal, delivery_fee, delivery_address, delivery_type, recipient_name, recipient_phone, payment_method, payment_status, notes, estimated_delivery, delivered_at, delivery_latitude, delivery_longitude, pickup_latitude, pickup_longitude) VALUES
('order_001', 'user_001', 'merch_001', 'driver_001', 'DELIVERED', 30500.00, 30000.00, 500.00, '12 Maitama Street, Abuja', 'yourself', 'John Doe', '+2348012345671', 'card', 'completed', 'Please deliver to the gate', '2024-12-14 15:30:00', '2024-12-14 15:45:00', 9.0820, 7.4950, 9.0679, 7.4345),
('order_002', 'user_002', 'merch_003', 'driver_002', 'DELIVERED', 45200.00, 44400.00, 800.00, '45 Gwarimpa Estate, Abuja', 'yourself', 'Jane Smith', '+2348012345672', 'card', 'completed', 'Ring the doorbell twice', '2024-12-15 12:00:00', '2024-12-15 12:15:00', 9.1103, 7.4114, 9.0765, 7.4897),
('order_003', 'user_003', 'merch_005', 'driver_003', 'IN_TRANSIT', 12000.00, 11400.00, 600.00, '78 Wuse 2, Abuja', 'yourself', 'Mike Johnson', '+2348012345673', 'cash', 'pending', 'Leave at the security post if I''m not home', '2024-12-16 18:30:00', NULL, 9.0643, 7.4820, 9.0643, 7.4820),
('order_004', 'user_001', 'merch_002', NULL, 'CONFIRMED', 25000.00, 24500.00, 500.00, '12 Maitama Street, Abuja', 'yourself', 'John Doe', '+2348012345671', 'card', 'pending', 'Urgent delivery needed', '2024-12-16 19:00:00', NULL, 9.0820, 7.4950, 9.1103, 7.4114),
('order_005', 'user_004', 'merch_004', NULL, 'PENDING', 18500.00, 17800.00, 700.00, '90 Asokoro, Abuja', 'yourself', 'Sarah Williams', '+2348012345674', 'card', 'pending', '', '2024-12-16 20:00:00', NULL, 9.0333, 7.5333, 9.0579, 7.4951),
('order_006', 'user_005', 'merch_006', 'driver_004', 'READY', 8700.00, 8200.00, 500.00, '15 Lokogoma, Abuja', 'yourself', 'David Brown', '+2348012345675', 'card', 'pending', 'Call before delivery', '2024-12-16 19:30:00', NULL, 9.0200, 7.4000, 9.0420, 7.4290),
('order_007', 'user_006', 'merch_007', NULL, 'PREPARING', 5600.00, 5100.00, 500.00, '23 Garki, Abuja', 'yourself', 'Emily Davis', '+2348012345676', 'cash', 'pending', 'Delivery for office staff', '2024-12-16 20:30:00', NULL, 9.0400, 7.4500, 9.0550, 7.4780),
('order_008', 'user_007', 'merch_001', 'driver_005', 'IN_TRANSIT', 18600.00, 18100.00, 500.00, '12 Jabi, Abuja', 'yourself', 'Chris Miller', '+2348012345677', 'card', 'pending', 'Leave with neighbor if not home', '2024-12-16 18:45:00', NULL, 9.0679, 7.4345, 9.0679, 7.4345),
('order_009', 'user_008', 'merch_003', NULL, 'CONFIRMED', 32500.00, 31800.00, 700.00, '5 Wuse, Abuja', 'yourself', 'Lisa Wilson', '+2348012345678', 'card', 'pending', 'Gift order - handle with care', '2024-12-16 19:15:00', NULL, 9.0550, 7.4780, 9.0765, 7.4897),
('order_010', 'user_009', 'merch_005', 'driver_006', 'DELIVERED', 15800.00, 15300.00, 500.00, '8 Garki, Abuja', 'yourself', 'James Moore', '+2348012345679', 'cash', 'completed', '', '2024-12-15 18:00:00', '2024-12-15 18:20:00', 9.0400, 7.4500, 9.0643, 7.4820);

-- Insert Order Items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
('oi_001', 'order_001', 'prod_001', 50, 617.00, 30850.00),
('oi_002', 'order_002', 'prod_016', 5, 7500.00, 37500.00),
('oi_003', 'order_002', 'prod_017', 1, 12000.00, 12000.00),
('oi_004', 'order_003', 'prod_046', 2, 3500.00, 7000.00),
('oi_005', 'order_003', 'prod_052', 2, 2800.00, 5600.00),
('oi_006', 'order_004', 'prod_004', 40, 615.00, 24600.00),
('oi_007', 'order_005', 'prod_024', 3, 4200.00, 12600.00),
('oi_008', 'order_005', 'prod_026', 2, 1800.00, 3600.00),
('oi_009', 'order_006', 'prod_066', 3, 1200.00, 3600.00),
('oi_010', 'order_006', 'prod_067', 2, 1000.00, 2000.00),
('oi_011', 'order_006', 'prod_068', 1, 800.00, 800.00),
('oi_012', 'order_007', 'prod_071', 2, 2800.00, 5600.00),
('oi_013', 'order_008', 'prod_002', 25, 720.00, 18000.00),
('oi_014', 'order_008', 'prod_008', 1, 2500.00, 2500.00),
('oi_015', 'order_009', 'prod_018', 10, 2800.00, 28000.00),
('oi_016', 'order_009', 'prod_020', 5, 850.00, 4250.00),
('oi_017', 'order_010', 'prod_056', 4, 2000.00, 8000.00),
('oi_018', 'order_010', 'prod_063', 2, 1200.00, 2400.00),
('oi_019', 'order_010', 'prod_064', 1, 1500.00, 1500.00);

-- Insert some cart items for active users
INSERT INTO cart_items (user_id, product_id, quantity) VALUES
('user_010', 'prod_046', 1),
('user_010', 'prod_047', 1),
('user_011', 'prod_001', 30),
('user_012', 'prod_016', 2),
('user_013', 'prod_076', 1),
('user_014', 'prod_091', 1),
('user_015', 'prod_101', 2),
('user_016', 'prod_031', 3),
('user_017', 'prod_054', 1),
('user_018', 'prod_023', 1),
('user_019', 'prod_069', 1),
('user_020', 'prod_088', 1);

-- Insert Delivery Zones
INSERT INTO delivery_zones (id, merchant_id, name, polygon, delivery_fee, min_order_amount, estimated_time_minutes, is_active) VALUES
('dz_001', 'merch_001', 'Jabi Zone', ST_GeogFromText('POLYGON((7.4200 9.0500, 7.4500 9.0500, 7.4500 9.0800, 7.4200 9.0800, 7.4200 9.0500))'), 500.00, 2000.00, 30, true),
('dz_002', 'merch_002', 'Gwarimpa Zone', ST_GeogFromText('POLYGON((7.4000 9.1000, 7.4300 9.1000, 7.4300 9.1300, 7.4000 9.1300, 7.4000 9.1000))'), 600.00, 2500.00, 35, true),
('dz_003', 'merch_003', 'Central Business District', ST_GeogFromText('POLYGON((7.4800 9.0400, 7.5100 9.0400, 7.5100 9.0700, 7.4800 9.0700, 7.4800 9.0400))'), 700.00, 3000.00, 40, true),
('dz_004', 'merch_004', 'Wuse Zone', ST_GeogFromText('POLYGON((7.4600 9.0500, 7.4900 9.0500, 7.4900 9.0800, 7.4600 9.0800, 7.4600 9.0500))'), 650.00, 2800.00, 35, true),
('dz_005', 'merch_005', 'Garki Zone', ST_GeogFromText('POLYGON((7.4200 9.0300, 7.4500 9.0300, 7.4500 9.0600, 7.4200 9.0600, 7.4200 9.0300))'), 550.00, 2200.00, 30, true);

-- Insert Addresses for users
INSERT INTO addresses (id, user_id, label, address_line1, address_line2, city, state, country, postal_code, location, is_default) VALUES
('addr_001', 'user_001', 'Home', '12 Maitama Street', '', 'Abuja', 'FCT', 'Nigeria', '900101', ST_GeogFromText('POINT(7.4950 9.0820)'), true),
('addr_002', 'user_002', 'Office', '45 Gwarimpa Estate', 'Suite 10', 'Abuja', 'FCT', 'Nigeria', '900102', ST_GeogFromText('POINT(7.4114 9.1103)'), true),
('addr_003', 'user_003', 'Home', '78 Wuse 2', 'Apartment 5B', 'Abuja', 'FCT', 'Nigeria', '900103', ST_GeogFromText('POINT(7.4820 9.0643)'), true),
('addr_004', 'user_004', 'Home', '90 Asokoro', '', 'Abuja', 'FCT', 'Nigeria', '900104', ST_GeogFromText('POINT(7.5333 9.0333)'), true),
('addr_005', 'user_005', 'Home', '15 Lokogoma', '', 'Abuja', 'FCT', 'Nigeria', '900105', ST_GeogFromText('POINT(7.4000 9.0200)'), true),
('addr_006', 'user_006', 'Office', '23 Garki', 'Floor 3', 'Abuja', 'FCT', 'Nigeria', '900106', ST_GeogFromText('POINT(7.4500 9.0400)'), true),
('addr_007', 'user_007', 'Home', '12 Jabi', '', 'Abuja', 'FCT', 'Nigeria', '900107', ST_GeogFromText('POINT(7.4345 9.0679)'), true),
('addr_008', 'user_008', 'Home', '5 Wuse', '', 'Abuja', 'FCT', 'Nigeria', '900108', ST_GeogFromText('POINT(7.4780 9.0550)'), true),
('addr_009', 'user_009', 'Home', '8 Garki', '', 'Abuja', 'FCT', 'Nigeria', '900109', ST_GeogFromText('POINT(7.4500 9.0400)'), true),
('addr_010', 'user_010', 'Home', '30 Life Camp', '', 'Abuja', 'FCT', 'Nigeria', '900110', ST_GeogFromText('POINT(7.4200 9.0100)'), true);

-- Insert Payment Methods
INSERT INTO payment_methods (id, user_id, type, last_four, card_brand, bank_name, account_number, is_default, is_active) VALUES
('pm_001', 'user_001', 'card', '1234', 'Visa', NULL, NULL, true, true),
('pm_002', 'user_001', 'bank', NULL, NULL, 'GTBank', '0123456789', false, true),
('pm_003', 'user_002', 'card', '5678', 'Mastercard', NULL, NULL, true, true),
('pm_004', 'user_003', 'card', '9012', 'Visa', NULL, NULL, true, true),
('pm_005', 'user_004', 'bank', NULL, NULL, 'Access Bank', '9876543210', true, true),
('pm_006', 'user_005', 'card', '3456', 'Verve', NULL, NULL, true, true),
('pm_007', 'user_006', 'wallet', NULL, NULL, NULL, NULL, true, true),
('pm_008', 'user_007', 'card', '7890', 'Mastercard', NULL, NULL, true, true),
('pm_009', 'user_008', 'bank', NULL, NULL, 'First Bank', '1122334455', true, true),
('pm_010', 'user_009', 'card', '4321', 'Visa', NULL, NULL, true, true);

-- Insert Reviews
INSERT INTO reviews (id, order_id, merchant_id, user_id, rating, comment, created_at) VALUES
('rev_001', 'order_001', 'merch_001', 'user_001', 5, 'Fast delivery and excellent service!', '2024-12-14 16:00:00'),
('rev_002', 'order_002', 'merch_003', 'user_002', 4, 'Good quality products, but delivery was slightly late.', '2024-12-15 12:30:00'),
('rev_003', 'order_010', 'merch_005', 'user_009', 5, 'Delicious food and quick delivery. Highly recommended!', '2024-12-15 18:30:00'),
('rev_004', 'order_003', 'merch_005', 'user_003', 4, 'Great taste, but packaging could be better.', '2024-12-16 