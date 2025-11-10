
-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT
USING (auth.uid()::text IN (
  SELECT firebase_uid FROM users WHERE id = cart_items.user_id
));

CREATE POLICY "Users can insert their own cart items"
ON cart_items FOR INSERT
WITH CHECK (auth.uid()::text IN (
  SELECT firebase_uid FROM users WHERE id = cart_items.user_id
));

CREATE POLICY "Users can update their own cart items"
ON cart_items FOR UPDATE
USING (auth.uid()::text IN (
  SELECT firebase_uid FROM users WHERE id = cart_items.user_id
));

CREATE POLICY "Users can delete their own cart items"
ON cart_items FOR DELETE
USING (auth.uid()::text IN (
  SELECT firebase_uid FROM users WHERE id = cart_items.user_id
));

-- Indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
