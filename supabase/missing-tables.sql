-- Missing Tables for Supabase Schema

-- Drivers table (extends users with driver-specific info)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  vehicle_type TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  license_number TEXT,
  license_expiry DATE,
  is_available BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2, 1) DEFAULT 0.0,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  polygon GEOGRAPHY(POLYGON),
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  estimated_time_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order locations table (for tracking order journey)
CREATE TABLE IF NOT EXISTS order_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  location GEOGRAPHY(POINT),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(10, 2),
  heading DECIMAL(5, 2),
  speed DECIMAL(10, 2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add driver_id to orders table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'driver_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id);
  END IF;
END $$;

-- Add coordinates columns to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_latitude'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_latitude DECIMAL(10, 8);
    ALTER TABLE orders ADD COLUMN delivery_longitude DECIMAL(11, 8);
    ALTER TABLE orders ADD COLUMN pickup_latitude DECIMAL(10, 8);
    ALTER TABLE orders ADD COLUMN pickup_longitude DECIMAL(11, 8);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_is_available ON drivers(is_available);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_merchant_id ON delivery_zones(merchant_id);
CREATE INDEX IF NOT EXISTS idx_order_locations_order_id ON order_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_locations_driver_id ON order_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_order_locations_timestamp ON order_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);

-- Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drivers
CREATE POLICY "Drivers can view their own profile"
  ON drivers FOR SELECT
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Drivers can update their own profile"
  ON drivers FOR UPDATE
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Anyone can view verified drivers"
  ON drivers FOR SELECT
  USING (is_verified = TRUE);

-- RLS Policies for delivery_zones
CREATE POLICY "Anyone can view active delivery zones"
  ON delivery_zones FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Merchants can manage their delivery zones"
  ON delivery_zones FOR ALL
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = (SELECT user_id FROM merchants WHERE id = merchant_id)));

-- RLS Policies for order_locations
CREATE POLICY "Users can view their order locations"
  ON order_locations FOR SELECT
  USING (
    auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = (SELECT user_id FROM orders WHERE id = order_id))
    OR auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = (SELECT user_id FROM drivers WHERE id = driver_id))
  );

CREATE POLICY "Drivers can insert their location updates"
  ON order_locations FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = (SELECT user_id FROM drivers WHERE id = driver_id)));

-- Add helpful comments
COMMENT ON TABLE drivers IS 'Driver profiles with vehicle and license information';
COMMENT ON TABLE delivery_zones IS 'Merchant delivery zones with polygons and fees';
COMMENT ON TABLE order_locations IS 'Real-time tracking of order delivery locations';
