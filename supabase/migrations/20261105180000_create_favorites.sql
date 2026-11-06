CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('merchant', 'commodity')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT favorites_user_item_unique UNIQUE (user_id, item_id, item_type)
);

CREATE INDEX IF NOT EXISTS favorites_user_created_at_idx
  ON public.favorites (user_id, created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.favorites FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.favorites TO service_role;
