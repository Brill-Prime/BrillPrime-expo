CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_type TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  license_number TEXT,
  license_expiry DATE,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC(2, 1) NOT NULL DEFAULT 0,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS license_expiry DATE,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_deliveries INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.drivers(id);

CREATE INDEX IF NOT EXISTS drivers_user_id_idx ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS drivers_availability_idx
  ON public.drivers(is_available, is_verified);
CREATE INDEX IF NOT EXISTS orders_driver_id_idx ON public.orders(driver_id);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.drivers;
CREATE POLICY "Drivers can view their own profile"
  ON public.drivers FOR SELECT
  USING (
    auth.uid()::text = (
      SELECT users.firebase_uid FROM public.users WHERE users.id = drivers.user_id
    )
    OR is_verified = TRUE
  );

DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.drivers;
CREATE POLICY "Drivers can update their own profile"
  ON public.drivers FOR UPDATE
  USING (
    auth.uid()::text = (
      SELECT users.firebase_uid FROM public.users WHERE users.id = drivers.user_id
    )
  )
  WITH CHECK (
    auth.uid()::text = (
      SELECT users.firebase_uid FROM public.users WHERE users.id = drivers.user_id
    )
  );

GRANT SELECT ON public.drivers TO authenticated;
GRANT UPDATE (is_available, updated_at) ON public.drivers TO authenticated;
