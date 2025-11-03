
-- =====================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Complete security implementation for BrillPrime
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE toll_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE toll_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to get current user's UUID from Firebase UID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM users 
    WHERE firebase_uid = auth.uid()::text
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE firebase_uid = auth.uid()::text 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE firebase_uid = auth.uid()::text 
    AND (role = required_role OR current_role = required_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (firebase_uid = auth.uid()::text OR is_admin());

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (firebase_uid = auth.uid()::text)
  WITH CHECK (firebase_uid = auth.uid()::text);

-- Only system can insert users (via sync function)
CREATE POLICY "users_insert_system" ON users
  FOR INSERT
  WITH CHECK (true);

-- Only admins can delete users
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE
  USING (is_admin());

-- =====================================================
-- USER ROLE STATUS POLICIES
-- =====================================================

CREATE POLICY "role_status_select_own" ON user_role_status
  FOR SELECT
  USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "role_status_insert_own" ON user_role_status
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "role_status_update_own" ON user_role_status
  FOR UPDATE
  USING (user_id = get_current_user_id() OR is_admin())
  WITH CHECK (user_id = get_current_user_id() OR is_admin());

-- =====================================================
-- USER ADDRESSES POLICIES
-- =====================================================

CREATE POLICY "addresses_select_own" ON user_addresses
  FOR SELECT
  USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "addresses_insert_own" ON user_addresses
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "addresses_update_own" ON user_addresses
  FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "addresses_delete_own" ON user_addresses
  FOR DELETE
  USING (user_id = get_current_user_id());

-- =====================================================
-- MERCHANTS TABLE POLICIES
-- =====================================================

-- Everyone can view active merchants
CREATE POLICY "merchants_select_active" ON merchants
  FOR SELECT
  USING (is_active = true OR user_id = get_current_user_id() OR is_admin());

-- Merchants can insert their own store
CREATE POLICY "merchants_insert_own" ON merchants
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id() AND has_role('merchant'));

-- Merchants can update their own store
CREATE POLICY "merchants_update_own" ON merchants
  FOR UPDATE
  USING (user_id = get_current_user_id() OR is_admin())
  WITH CHECK (user_id = get_current_user_id() OR is_admin());

-- Only admins can delete merchants
CREATE POLICY "merchants_delete_admin" ON merchants
  FOR DELETE
  USING (is_admin());

-- =====================================================
-- COMMODITIES TABLE POLICIES
-- =====================================================

-- Everyone can view active commodities
CREATE POLICY "commodities_select_active" ON commodities
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Only admins can manage commodities (central catalog)
CREATE POLICY "commodities_insert_admin" ON commodities
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "commodities_update_admin" ON commodities
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "commodities_delete_admin" ON commodities
  FOR DELETE
  USING (is_admin());

-- =====================================================
-- MERCHANT COMMODITIES POLICIES
-- =====================================================

-- Everyone can view available merchant commodities
CREATE POLICY "merchant_commodities_select_all" ON merchant_commodities
  FOR SELECT
  USING (
    is_available = true 
    OR merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id())
    OR is_admin()
  );

-- Merchants can add commodities to their store
CREATE POLICY "merchant_commodities_insert_own" ON merchant_commodities
  FOR INSERT
  WITH CHECK (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id())
  );

-- Merchants can update their own commodities
CREATE POLICY "merchant_commodities_update_own" ON merchant_commodities
  FOR UPDATE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id())
    OR is_admin()
  )
  WITH CHECK (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id())
    OR is_admin()
  );

-- Merchants can delete their own commodities
CREATE POLICY "merchant_commodities_delete_own" ON merchant_commodities
  FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id())
    OR is_admin()
  );

-- =====================================================
-- CART ITEMS POLICIES
-- =====================================================

CREATE POLICY "cart_select_own" ON cart_items
  FOR SELECT
  USING (user_id = get_current_user_id());

CREATE POLICY "cart_insert_own" ON cart_items
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "cart_update_own" ON cart_items
  FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "cart_delete_own" ON cart_items
  FOR DELETE
  USING (user_id = get_current_user_id());

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Users can view their own orders (as customer, merchant, or driver)
CREATE POLICY "orders_select_involved" ON orders
  FOR SELECT
  USING (
    user_id = get_current_user_id() -- Customer
    OR merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id()) -- Merchant
    OR driver_id = get_current_user_id() -- Driver
    OR is_admin()
  );

-- Customers can create orders
CREATE POLICY "orders_insert_customer" ON orders
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

-- Customers, merchants, and drivers can update orders (based on their role)
CREATE POLICY "orders_update_involved" ON orders
  FOR UPDATE
  USING (
    user_id = get_current_user_id() -- Customer can cancel
    OR merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id()) -- Merchant can update status
    OR driver_id = get_current_user_id() -- Driver can update delivery status
    OR is_admin()
  )
  WITH CHECK (
    user_id = get_current_user_id()
    OR merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id())
    OR driver_id = get_current_user_id()
    OR is_admin()
  );

-- Only admins can delete orders
CREATE POLICY "orders_delete_admin" ON orders
  FOR DELETE
  USING (is_admin());

-- =====================================================
-- ORDER TRACKING POLICIES
-- =====================================================

CREATE POLICY "order_tracking_select_involved" ON order_tracking
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE user_id = get_current_user_id()
      OR merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id())
      OR driver_id = get_current_user_id()
    )
    OR is_admin()
  );

CREATE POLICY "order_tracking_insert_involved" ON order_tracking
  FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders 
      WHERE merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id())
      OR driver_id = get_current_user_id()
    )
    OR is_admin()
  );

-- =====================================================
-- DRIVER LOCATIONS POLICIES
-- =====================================================

-- Customers can view driver location if driver is assigned to their order
CREATE POLICY "driver_locations_select_customer" ON driver_locations
  FOR SELECT
  USING (
    driver_id IN (SELECT driver_id FROM orders WHERE user_id = get_current_user_id() AND driver_id IS NOT NULL)
    OR driver_id = get_current_user_id()
    OR is_admin()
  );

-- Only drivers can update their own location
CREATE POLICY "driver_locations_insert_own" ON driver_locations
  FOR INSERT
  WITH CHECK (driver_id = get_current_user_id() AND has_role('driver'));

CREATE POLICY "driver_locations_update_own" ON driver_locations
  FOR UPDATE
  USING (driver_id = get_current_user_id())
  WITH CHECK (driver_id = get_current_user_id());

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

CREATE POLICY "payments_select_own" ON payments
  FOR SELECT
  USING (
    user_id = get_current_user_id()
    OR order_id IN (SELECT id FROM orders WHERE merchant_id IN (SELECT id FROM merchants WHERE user_id = get_current_user_id()))
    OR is_admin()
  );

CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "payments_update_system" ON payments
  FOR UPDATE
  USING (is_admin()); -- Only system/admin can update payment status

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT
  USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "transactions_insert_system" ON transactions
  FOR INSERT
  WITH CHECK (true); -- System creates transactions

-- =====================================================
-- ESCROW TRANSACTIONS POLICIES
-- =====================================================

CREATE POLICY "escrow_select_involved" ON escrow_transactions
  FOR SELECT
  USING (
    buyer_id = get_current_user_id()
    OR seller_id = get_current_user_id()
    OR is_admin()
  );

CREATE POLICY "escrow_insert_system" ON escrow_transactions
  FOR INSERT
  WITH CHECK (true); -- System creates escrow

CREATE POLICY "escrow_update_admin" ON escrow_transactions
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (user_id = get_current_user_id());

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT
  WITH CHECK (true); -- System sends notifications

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE
  USING (user_id = get_current_user_id());

-- =====================================================
-- CONVERSATIONS & MESSAGES POLICIES
-- =====================================================

CREATE POLICY "conversations_select_participant" ON conversations
  FOR SELECT
  USING (
    get_current_user_id() = ANY(participants)
    OR is_admin()
  );

CREATE POLICY "conversations_insert_participant" ON conversations
  FOR INSERT
  WITH CHECK (get_current_user_id() = ANY(participants));

CREATE POLICY "messages_select_participant" ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE get_current_user_id() = ANY(participants)
    )
    OR is_admin()
  );

CREATE POLICY "messages_insert_participant" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = get_current_user_id()
    AND conversation_id IN (
      SELECT id FROM conversations 
      WHERE get_current_user_id() = ANY(participants)
    )
  );

CREATE POLICY "messages_update_sender" ON messages
  FOR UPDATE
  USING (sender_id = get_current_user_id())
  WITH CHECK (sender_id = get_current_user_id());

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT
  USING (true); -- Reviews are public

CREATE POLICY "reviews_insert_customer" ON reviews
  FOR INSERT
  WITH CHECK (
    user_id = get_current_user_id()
    AND order_id IN (SELECT id FROM orders WHERE user_id = get_current_user_id() AND status = 'delivered')
  );

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE
  USING (user_id = get_current_user_id() OR is_admin());

-- =====================================================
-- FAVORITES POLICIES
-- =====================================================

CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT
  USING (user_id = get_current_user_id());

CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE
  USING (user_id = get_current_user_id());

-- =====================================================
-- KYC DOCUMENTS POLICIES
-- =====================================================

CREATE POLICY "kyc_select_own" ON kyc_documents
  FOR SELECT
  USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "kyc_insert_own" ON kyc_documents
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "kyc_update_admin" ON kyc_documents
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- TOLL GATES POLICIES
-- =====================================================

CREATE POLICY "toll_gates_select_all" ON toll_gates
  FOR SELECT
  USING (is_open = true OR is_admin());

CREATE POLICY "toll_gates_manage_admin" ON toll_gates
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- TOLL PAYMENTS POLICIES
-- =====================================================

CREATE POLICY "toll_payments_select_own" ON toll_payments
  FOR SELECT
  USING (user_id = get_current_user_id() OR is_admin());

CREATE POLICY "toll_payments_insert_own" ON toll_payments
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- PUSH TOKENS POLICIES
-- =====================================================

CREATE POLICY "push_tokens_select_own" ON push_tokens
  FOR SELECT
  USING (user_id = get_current_user_id());

CREATE POLICY "push_tokens_insert_own" ON push_tokens
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "push_tokens_update_own" ON push_tokens
  FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "push_tokens_delete_own" ON push_tokens
  FOR DELETE
  USING (user_id = get_current_user_id());

-- =====================================================
-- ADMIN SETTINGS POLICIES
-- =====================================================

CREATE POLICY "admin_settings_select_admin" ON admin_settings
  FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_settings_manage_admin" ON admin_settings
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =====================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
