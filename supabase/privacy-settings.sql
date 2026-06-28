
-- Privacy Settings Table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_collection BOOLEAN DEFAULT true,
  analytics BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  location_tracking BOOLEAN DEFAULT true,
  profile_visibility BOOLEAN DEFAULT true,
  activity_status BOOLEAN DEFAULT true,
  order_history BOOLEAN DEFAULT true,
  share_with_partners BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Data Deletion Requests Table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Export Requests Table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  download_url TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user ON user_privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_export_requests_user ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_export_requests_status ON data_export_requests(status);

-- Enable RLS
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_privacy_settings
CREATE POLICY "Users can view their own privacy settings"
  ON user_privacy_settings FOR SELECT
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own privacy settings"
  ON user_privacy_settings FOR UPDATE
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own privacy settings"
  ON user_privacy_settings FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

-- RLS Policies for data_deletion_requests
CREATE POLICY "Users can view their own deletion requests"
  ON data_deletion_requests FOR SELECT
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can create deletion requests"
  ON data_deletion_requests FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

-- RLS Policies for data_export_requests
CREATE POLICY "Users can view their own export requests"
  ON data_export_requests FOR SELECT
  USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

CREATE POLICY "Users can create export requests"
  ON data_export_requests FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER privacy_settings_updated_at
  BEFORE UPDATE ON user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_privacy_settings_updated_at();
