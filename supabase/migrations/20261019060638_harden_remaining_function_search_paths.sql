-- Pin search_path for remaining application-owned public functions.
-- These functions use objects in public (including PostGIS objects installed
-- there) and do not need caller-controlled schemas in the lookup path.
ALTER FUNCTION public.update_driver_location_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_heatmap_data(double precision, double precision, double precision, double precision, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_clustered_heatmap(double precision, double precision, double precision, double precision, double precision, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_within_delivery_zone(uuid, double precision, double precision) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_privacy_settings_updated_at() SET search_path = public, pg_temp;
