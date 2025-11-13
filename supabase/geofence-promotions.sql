
-- Geofence Promotions Table
CREATE TABLE IF NOT EXISTS geofence_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  geometry GEOGRAPHY(POLYGON, 4326) NOT NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_geofence_promotions_geometry ON geofence_promotions USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_geofence_promotions_merchant ON geofence_promotions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_geofence_promotions_dates ON geofence_promotions(start_date, end_date);

-- Enable RLS
ALTER TABLE geofence_promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY geofence_promotions_merchant_all ON geofence_promotions
  FOR ALL
  USING (auth.uid() = merchant_id);

CREATE POLICY geofence_promotions_read_active ON geofence_promotions
  FOR SELECT
  USING (
    is_active = true 
    AND NOW() BETWEEN start_date AND end_date
    AND (usage_limit IS NULL OR usage_count < usage_limit)
  );

-- Function to get active promotions for a location
CREATE OR REPLACE FUNCTION get_location_promotions(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
RETURNS TABLE(
  promo_id UUID,
  merchant_id UUID,
  title VARCHAR,
  description TEXT,
  discount_type VARCHAR,
  discount_value DECIMAL,
  min_purchase_amount DECIMAL,
  max_discount_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.id,
    gp.merchant_id,
    gp.title,
    gp.description,
    gp.discount_type,
    gp.discount_value,
    gp.min_purchase_amount,
    gp.max_discount_amount
  FROM geofence_promotions gp
  WHERE gp.is_active = true
    AND NOW() BETWEEN gp.start_date AND gp.end_date
    AND (gp.usage_limit IS NULL OR gp.usage_count < gp.usage_limit)
    AND ST_Contains(
      gp.geometry::geometry,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geometry
    );
END;
$$ LANGUAGE plpgsql;
