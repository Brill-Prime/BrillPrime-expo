-- Additional MySQL schema to cover remaining tables from Postgres schema

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type ENUM('order','promo','system','delivery','payment','promotion') NOT NULL,
  role ENUM('consumer','merchant','driver','admin'),
  read_flag TINYINT(1) DEFAULT 0,
  priority ENUM('high','medium','low') DEFAULT 'medium',
  data JSON,
  action TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36),
  consumer_id VARCHAR(36),
  merchant_id VARCHAR(36),
  driver_id VARCHAR(36),
  last_message TEXT,
  last_message_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36),
  sender_id VARCHAR(36),
  message TEXT NOT NULL,
  message_type ENUM('text','image','location') DEFAULT 'text',
  read_flag TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  type ENUM('card','bank','wallet') NOT NULL,
  last_four VARCHAR(10),
  card_brand VARCHAR(50),
  bank_name VARCHAR(100),
  account_number VARCHAR(100),
  is_default TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  label VARCHAR(100),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(50),
  latitude DOUBLE,
  longitude DOUBLE,
  is_default TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kyc_documents (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  document_type ENUM('id_card','passport','drivers_license','business_license','tax_id') NOT NULL,
  document_url TEXT NOT NULL,
  verification_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  verified_at DATETIME,
  verified_by VARCHAR(36),
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36),
  merchant_id VARCHAR(36),
  user_id VARCHAR(36),
  rating INT NOT NULL,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
