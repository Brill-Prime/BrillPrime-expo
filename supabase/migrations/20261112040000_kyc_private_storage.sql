CREATE TABLE IF NOT EXISTS public.kyc_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  driver_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('incomplete', 'pending', 'verified', 'rejected')),
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kyc_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_role_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('merchant', 'driver')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  registration_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_role_registrations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.kyc_documents
  ADD COLUMN IF NOT EXISTS back_document_url TEXT,
  ADD COLUMN IF NOT EXISTS document_number_last4 TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

ALTER TABLE public.kyc_documents
  DROP CONSTRAINT IF EXISTS kyc_documents_document_type_check;
ALTER TABLE public.kyc_documents
  ADD CONSTRAINT kyc_documents_document_type_check
  CHECK (document_type IN (
    'id_card',
    'passport',
    'drivers_license',
    'business_license',
    'tax_id',
    'address',
    'vehicle_registration'
  ));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];
