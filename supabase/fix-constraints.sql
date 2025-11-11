
-- Fix missing unique constraints for Supabase real-time operations
-- This resolves the "no unique or exclusion constraint matching the ON CONFLICT specification" error

-- Add unique constraint on users table for firebase_uid if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_firebase_uid_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_firebase_uid_unique UNIQUE (firebase_uid);
    END IF;
END $$;

-- Add unique constraint on cart_items table for user_id and commodity_id combination
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cart_items_user_commodity_unique'
    ) THEN
        ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_commodity_unique UNIQUE (user_id, commodity_id);
    END IF;
END $$;

-- Add unique constraint on driver_locations table for driver_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'driver_locations_driver_id_unique'
    ) THEN
        ALTER TABLE driver_locations ADD CONSTRAINT driver_locations_driver_id_unique UNIQUE (driver_id);
    END IF;
END $$;

-- Add unique constraint on notifications table if needed for user_id + type + reference_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_unique_reference'
    ) THEN
        -- Only add if notifications table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
            ALTER TABLE notifications ADD CONSTRAINT notifications_unique_reference UNIQUE (user_id, type, reference_id);
        END IF;
    END IF;
END $$;

-- Add index on users email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Add index on orders user_id for faster queries
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);

-- Add index on cart_items user_id for faster queries
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON cart_items(user_id);

-- Ensure real-time is enabled on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS users;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS orders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS driver_locations;

-- Grant necessary permissions for real-time subscriptions
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON orders TO authenticated;
GRANT SELECT ON cart_items TO authenticated;
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON driver_locations TO authenticated;
