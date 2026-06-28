-- Convert missing tables (drivers, delivery_zones, order_locations) for MySQL
CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE,
  vehicle_type TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  license_number TEXT,
  license_expiry DATE,
  is_available TINYINT(1) DEFAULT 0,
  is_verified TINYINT(1) DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0.0,
  total_deliveries INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id VARCHAR(36) PRIMARY KEY,
  merchant_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  polygon TEXT, -- Geo polygon (WKT or GeoJSON) stored as text
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  estimated_time_minutes INT DEFAULT 30,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_locations (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36),
  driver_id VARCHAR(36),
  latitude DOUBLE,
  longitude DOUBLE,
  accuracy DOUBLE,
  heading DOUBLE,
  speed DOUBLE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Add columns to orders if not exists (driver_id and coordinates)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS driver_id VARCHAR(36),
  ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE,
  ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE,
  ADD COLUMN IF NOT EXISTS pickup_latitude DOUBLE,
  ADD COLUMN IF NOT EXISTS pickup_longitude DOUBLE;

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_is_available ON drivers(is_available);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_merchant_id ON delivery_zones(merchant_id);
CREATE INDEX IF NOT EXISTS idx_order_locations_order_id ON order_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_locations_driver_id ON order_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_order_locations_timestamp ON order_locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
