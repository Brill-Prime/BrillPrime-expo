-- spatial_ref_sys contains public spatial-reference metadata used by PostGIS.
-- Keep reads available to clients while enforcing RLS on this exposed table.
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spatial_ref_sys_read_public ON public.spatial_ref_sys;
CREATE POLICY spatial_ref_sys_read_public
  ON public.spatial_ref_sys
  FOR SELECT
  TO anon, authenticated
  USING (true);
