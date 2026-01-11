-- Complete Comprehensive Test Data for Brill Prime
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
('user_013', 'firebase_uid_user_013', 'daniel.consumer@test.com', 'Daniel Jackson', 'consumer', '+23480123