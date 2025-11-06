
-- Driver Locations Table for Real-time Tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp);

-- Enable RLS
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drivers can update their own location
CREATE POLICY driver_locations_driver_update ON driver_locations
  FOR UPDATE
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- Drivers can insert their own location
CREATE POLICY driver_locations_driver_insert ON driver_locations
  FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Everyone can read driver locations (for tracking)
CREATE POLICY driver_locations_read_all ON driver_locations
  FOR SELECT
  USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_driver_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_driver_location_timestamp
  BEFORE UPDATE ON driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_location_timestamp();

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
