-- Restrict promotions writes to the owning active merchant.
-- Public clients can only read active promotions within their validity window.
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.current_user_owns_merchant(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.merchants m
    join public.users u on u.id = m.user_id
    where m.id = p_merchant_id
      and u.firebase_uid = (select auth.jwt() ->> 'sub')
      and u.role = 'merchant'
      and u.is_active is true
  );
$function$;

revoke all on function app_private.current_user_owns_merchant(uuid) from public, anon;
grant execute on function app_private.current_user_owns_merchant(uuid) to authenticated;

alter table public.promotions enable row level security;
drop policy if exists promotions_public_read_active on public.promotions;
create policy promotions_public_read_active
  on public.promotions for select to anon, authenticated
  using (is_active is true and start_date <= now() and end_date >= now());

drop policy if exists promotions_merchant_manage_own on public.promotions;
create policy promotions_merchant_manage_own
  on public.promotions for all to authenticated
  using (app_private.current_user_owns_merchant(merchant_id))
  with check (app_private.current_user_owns_merchant(merchant_id));
