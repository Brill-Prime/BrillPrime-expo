
-- Function to find nearby merchants using PostGIS
CREATE OR REPLACE FUNCTION nearby_merchants(lat double precision, lng double precision, radius_km double precision)
RETURNS TABLE (
  id uuid,
  business_name text,
  address text,
  distance_km double precision,
  location geography,
  user_id uuid,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.business_name,
    m.address,
    ST_Distance(
      m.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000 AS distance_km,
    m.location,
    m.user_id,
    m.created_at
  FROM merchants m
  WHERE ST_DWithin(
    m.location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
