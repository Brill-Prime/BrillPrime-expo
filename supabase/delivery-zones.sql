
-- Delivery Zones Table
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  geometry GEOGRAPHY(POLYGON, 4326) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_delivery_time INTEGER, -- in minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_delivery_zones_geometry ON delivery_zones USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_merchant ON delivery_zones(merchant_id);

-- Enable RLS
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY delivery_zones_merchant_all ON delivery_zones
  FOR ALL
  USING (auth.uid() = merchant_id);

CREATE POLICY delivery_zones_read_all ON delivery_zones
  FOR SELECT
  USING (is_active = true);

-- Function to check if a point is within delivery zone
CREATE OR REPLACE FUNCTION is_within_delivery_zone(
  merchant_id_param UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
RETURNS TABLE(
  zone_id UUID,
  zone_name VARCHAR,
  delivery_fee DECIMAL,
  min_order_amount DECIMAL,
  max_delivery_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dz.id,
    dz.name,
    dz.delivery_fee,
    dz.min_order_amount,
    dz.max_delivery_time
  FROM delivery_zones dz
  WHERE dz.merchant_id = merchant_id_param
    AND dz.is_active = true
    AND ST_Contains(
      dz.geometry::geometry,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geometry
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_delivery_zone_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_zone_timestamp
  BEFORE UPDATE ON delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_zone_timestamp();
