-- Harden trigger-only SECURITY DEFINER functions.
-- These functions are invoked by database triggers, not exposed as public RPCs.
alter function public.products_broadcast_trigger() set search_path = '';
alter function public.update_updated_at_column() set search_path = '';
revoke execute on function public.products_broadcast_trigger() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
