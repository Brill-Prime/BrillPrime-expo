-- Migration: Driver Analytics, Earnings, Vehicles, and Dispute Details
-- This migration adds tables for driver performance tracking, earnings management, 
-- vehicle management, and escrow dispute details

-- Driver Vehicles
CREATE TABLE IF NOT EXISTS driver_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
  color TEXT NOT NULL,
  license_plate TEXT NOT NULL UNIQUE,
  registration_number TEXT NOT NULL,
  insurance_policy_number TEXT NOT NULL,
  insurance_expiry DATE NOT NULL,
  road_worthiness_expiry DATE NOT NULL,
  vehicle_status TEXT DEFAULT 'active' CHECK (vehicle_status IN ('active', 'inactive', 'maintenance', 'deactivated')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id)
);

-- Driver Vehicle Documents
CREATE TABLE IF NOT EXISTS driver_vehicle_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES driver_vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('registration', 'insurance', 'road_worthiness', 'drivers_license')),
  document_url TEXT NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(vehicle_id, document_type)
);

-- Driver Deliveries (tracks each delivery for analytics)
CREATE TABLE IF NOT EXISTS driver_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  distance_km DECIMAL(8, 2),
  duration_minutes INTEGER,
  earnings DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Earnings (tracks daily earnings summaries for faster queries)
CREATE TABLE IF NOT EXISTS driver_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_deliveries INTEGER DEFAULT 0,
  total_distance_km DECIMAL(10, 2) DEFAULT 0,
  total_hours DECIMAL(5, 2) DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  base_earnings DECIMAL(10, 2) DEFAULT 0,
  tips DECIMAL(10, 2) DEFAULT 0,
  bonuses DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  net_earnings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id, date)
);

-- Driver Performance Metrics (tracks rolling performance stats)
CREATE TABLE IF NOT EXISTS driver_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  total_deliveries INTEGER DEFAULT 0,
  completed_deliveries INTEGER DEFAULT 0,
  cancelled_deliveries INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5, 2) DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  on_time_delivery_rate DECIMAL(5, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  positive_ratings INTEGER DEFAULT 0,
  neutral_ratings INTEGER DEFAULT 0,
  negative_ratings INTEGER DEFAULT 0,
  average_response_time_minutes DECIMAL(5, 2) DEFAULT 0,
  route_efficiency_score DECIMAL(5, 2) DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_distance_km DECIMAL(10, 2) DEFAULT 0,
  total_hours DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id, period_start, period_end, period_type)
);

-- Driver Peak Hours (tracks hourly performance patterns)
CREATE TABLE IF NOT EXISTS driver_peak_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day < 24),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week < 7),
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id, hour_of_day, day_of_week)
);

-- Escrow Disputes (detailed dispute tracking)
CREATE TABLE IF NOT EXISTS escrow_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_transaction_id UUID REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  raised_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
  resolution TEXT,
  resolved_by_admin_id UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Ratings (detailed ratings from customers)
CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT CHECK (feedback_type IN ('positive', 'neutral', 'negative')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, customer_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver_id ON driver_vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_deliveries_driver_id ON driver_deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_deliveries_created_at ON driver_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id_date ON driver_earnings(driver_id, date);
CREATE INDEX IF NOT EXISTS idx_driver_performance_driver_id ON driver_performance_metrics(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_peak_hours_driver_id ON driver_peak_hours(driver_id);
CREATE INDEX IF NOT EXISTS idx_escrow_disputes_escrow_id ON escrow_disputes(escrow_transaction_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_id ON driver_ratings(driver_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_driver_vehicles_updated_at BEFORE UPDATE ON driver_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_deliveries_updated_at BEFORE UPDATE ON driver_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_earnings_updated_at BEFORE UPDATE ON driver_earnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_performance_metrics_updated_at BEFORE UPDATE ON driver_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_disputes_updated_at BEFORE UPDATE ON escrow_disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE driver_vehicles IS 'Stores vehicle information for drivers';
COMMENT ON TABLE driver_vehicle_documents IS 'Stores verification documents for driver vehicles';
COMMENT ON TABLE driver_deliveries IS 'Tracks individual delivery details for analytics';
COMMENT ON TABLE driver_earnings IS 'Daily earnings summary for drivers';
COMMENT ON TABLE driver_performance_metrics IS 'Rolling performance metrics for drivers';
COMMENT ON TABLE driver_peak_hours IS 'Hourly performance patterns for drivers';
COMMENT ON TABLE escrow_disputes IS 'Detailed dispute information for escrow transactions';
COMMENT ON TABLE driver_ratings IS 'Customer ratings and feedback for drivers';
