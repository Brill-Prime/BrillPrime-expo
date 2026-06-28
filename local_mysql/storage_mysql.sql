-- Simplified storage metadata tables to represent Supabase storage buckets and objects
CREATE TABLE IF NOT EXISTS storage_buckets (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_public TINYINT(1) DEFAULT 0,
  file_size_limit BIGINT DEFAULT 0,
  allowed_mime_types JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_objects (
  id VARCHAR(100) PRIMARY KEY,
  bucket_id VARCHAR(100) NOT NULL,
  owner VARCHAR(255),
  name VARCHAR(255),
  path TEXT,
  size BIGINT,
  content_type VARCHAR(255),
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bucket_id) REFERENCES storage_buckets(id) ON DELETE CASCADE
);

-- Seed common buckets
INSERT IGNORE INTO storage_buckets (id, name, is_public, file_size_limit, allowed_mime_types)
VALUES
('product-images', 'product-images', 1, 5242880, JSON_ARRAY('image/jpeg','image/png','image/jpg','image/webp')),
('profile-images', 'profile-images', 1, 2097152, JSON_ARRAY('image/jpeg','image/png','image/jpg','image/webp')),
('attachments', 'attachments', 1, 10485760, JSON_ARRAY('image/jpeg','image/png','image/jpg','image/webp','application/pdf','text/plain')),
('kyc-documents', 'kyc-documents', 0, 10485760, JSON_ARRAY('image/jpeg','image/png','application/pdf'));

-- Note: Access controls (RLS in Postgres) should be implemented in application logic.
