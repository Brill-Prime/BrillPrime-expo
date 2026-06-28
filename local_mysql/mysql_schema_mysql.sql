-- MySQL-compatible schema (converted from Postgres schema)
-- NOTE: This is a best-effort conversion. Review constraints and types before production use.

-- Use VARCHAR(36) for IDs (seed uses custom ids like 'user_001')
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name TEXT,
  role ENUM('consumer','merchant','driver','admin') NOT NULL,
  phone_number VARCHAR(50),
  profile_image_url TEXT,
  is_verified TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchants (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  business_name TEXT NOT NULL,
  business_type TEXT,
  latitude DOUBLE,
  longitude DOUBLE,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  operating_hours JSON,
  rating DECIMAL(3,1) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  is_verified TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  merchant_id VARCHAR(36),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  image_url TEXT,
  is_available TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  merchant_id VARCHAR(36),
  status ENUM('PENDING','CONFIRMED','PREPARING','READY','IN_TRANSIT','DELIVERED','CANCELLED') NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  delivery_address TEXT NOT NULL,
  delivery_type ENUM('yourself','someone_else'),
  recipient_name TEXT,
  recipient_phone TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  estimated_delivery DATETIME,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36),
  product_id VARCHAR(36),
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  product_id VARCHAR(36),
  quantity INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS driver_locations (
  id VARCHAR(36) PRIMARY KEY,
  driver_id VARCHAR(36),
  latitude DOUBLE,
  longitude DOUBLE,
  heading DOUBLE,
  speed DOUBLE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
