
-- Order Heatmap Data
CREATE TABLE IF NOT EXISTS order_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  order_value DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_locations_geography ON order_locations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_order_locations_created ON order_locations(created_at);

-- Function to get heatmap data
CREATE OR REPLACE FUNCTION get_heatmap_data(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  order_count BIGINT,
  total_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ST_Y(location::geometry) as latitude,
    ST_X(location::geometry) as longitude,
    COUNT(*) as order_count,
    SUM(order_value) as total_value
  FROM order_locations
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND ST_Contains(
      ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography::geometry,
      location::geometry
    )
  GROUP BY latitude, longitude;
END;
$$ LANGUAGE plpgsql;

-- Function to get clustered heatmap data (aggregated by grid)
CREATE OR REPLACE FUNCTION get_clustered_heatmap(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION,
  grid_size DOUBLE PRECISION DEFAULT 0.01,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  grid_lat DOUBLE PRECISION,
  grid_lng DOUBLE PRECISION,
  order_count BIGINT,
  total_value DECIMAL,
  intensity DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    FLOOR(ST_Y(location::geometry) / grid_size) * grid_size as grid_lat,
    FLOOR(ST_X(location::geometry) / grid_size) * grid_size as grid_lng,
    COUNT(*) as order_count,
    SUM(order_value) as total_value,
    (COUNT(*)::DOUBLE PRECISION / GREATEST(SUM(COUNT(*)) OVER(), 1)) as intensity
  FROM order_locations
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND ST_Contains(
      ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography::geometry,
      location::geometry
    )
  GROUP BY grid_lat, grid_lng
  ORDER BY order_count DESC;
END;
$$ LANGUAGE plpgsql;
