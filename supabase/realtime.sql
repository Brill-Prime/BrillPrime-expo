
-- Enable realtime for tables that need live updates

-- Core operational tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS users;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS orders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS products;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS merchants;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_privacy_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS data_deletion_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS data_export_requests;

-- Grant necessary permissions for real-time subscriptions
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON orders TO authenticated;
GRANT SELECT ON order_items TO authenticated;
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON conversations TO authenticated;
GRANT SELECT ON products TO authenticated;
GRANT SELECT ON cart_items TO authenticated;
GRANT SELECT ON driver_locations TO authenticated;
GRANT SELECT ON merchants TO authenticated;
GRANT SELECT ON user_privacy_settings TO authenticated;
GRANT SELECT ON data_deletion_requests TO authenticated;
GRANT SELECT ON data_export_requests TO authenticated;
