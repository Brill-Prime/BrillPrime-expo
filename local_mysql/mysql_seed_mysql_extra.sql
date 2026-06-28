-- Extra seed data: notifications, conversations, messages, payment_methods, addresses, kyc_documents, reviews
SET FOREIGN_KEY_CHECKS=0;

TRUNCATE TABLE notifications;
TRUNCATE TABLE conversations;
TRUNCATE TABLE messages;
TRUNCATE TABLE payment_methods;
TRUNCATE TABLE addresses;
TRUNCATE TABLE kyc_documents;
TRUNCATE TABLE reviews;

SET FOREIGN_KEY_CHECKS=1;

-- Notifications
INSERT INTO notifications (id, user_id, title, message, type, role, read_flag, priority, created_at)
VALUES
('note_001', 'user_001', 'Order Delivered', 'Your order order_001 was delivered successfully', 'order', 'consumer', 0, 'high', NOW());

-- Conversations and Messages
INSERT INTO conversations (id, order_id, consumer_id, merchant_id, driver_id, last_message, last_message_at)
VALUES
('conv_001', 'order_001', 'user_001', 'merch_001', 'driver_001', 'Your order is on the way', NOW());

INSERT INTO messages (id, conversation_id, sender_id, message, message_type)
VALUES
('msg_001', 'conv_001', 'merchant', 'Your order is on the way', 'text');

-- Payment methods
INSERT INTO payment_methods (id, user_id, type, last_four, card_brand, is_default, is_active)
VALUES
('pm_001', 'user_001', 'card', '4242', 'Visa', 1, 1);

-- Addresses
INSERT INTO addresses (id, user_id, label, address_line1, city, state, country, latitude, longitude, is_default)
VALUES
('addr_001', 'user_001', 'Home', '12 Maitama Street', 'Abuja', 'FCT', 'Nigeria', 9.0820, 7.4950, 1);

-- KYC Documents
INSERT INTO kyc_documents (id, user_id, document_type, document_url, verification_status)
VALUES
('kyc_001', 'driver_001', 'drivers_license', 'https://example.com/kyc/driver_001_license.jpg', 'approved');

-- Reviews
INSERT INTO reviews (id, order_id, merchant_id, user_id, rating, comment)
VALUES
('rev_001', 'order_001', 'merch_001', 'user_001', 5, 'Great service and fast delivery');
