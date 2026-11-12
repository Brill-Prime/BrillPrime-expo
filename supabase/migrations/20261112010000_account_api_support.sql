CREATE TABLE IF NOT EXISTS public.account_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  notifications BOOLEAN NOT NULL DEFAULT TRUE,
  location_services BOOLEAN NOT NULL DEFAULT TRUE,
  email_updates BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  data_collection BOOLEAN NOT NULL DEFAULT TRUE,
  analytics BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_emails BOOLEAN NOT NULL DEFAULT FALSE,
  location_tracking BOOLEAN NOT NULL DEFAULT TRUE,
  profile_visibility BOOLEAN NOT NULL DEFAULT TRUE,
  activity_status BOOLEAN NOT NULL DEFAULT TRUE,
  order_history BOOLEAN NOT NULL DEFAULT TRUE,
  share_with_partners BOOLEAN NOT NULL DEFAULT FALSE,
  allow_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS delivery_radius_km NUMERIC,
  ADD COLUMN IF NOT EXISTS minimum_order NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS accepts_orders BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.user_privacy_settings
  ADD COLUMN IF NOT EXISTS allow_notifications BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
