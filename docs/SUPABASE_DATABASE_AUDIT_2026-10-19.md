# Supabase Database Audit — 19 October 2026

## Scope and verification

This audit checked the connected Brill Prime Supabase project, project health, public schema inventory, migration history, installed extensions, RLS policy inventory, Realtime publication membership, security/performance advisors, and aggregated service logs. No customer records or credentials are included in this report.

## Current health

- Supabase project status: `ACTIVE_HEALTHY`.
- PostgreSQL: 17.
- Public schema inventory: 28 tables; RLS enabled on 26, disabled on 2.
- Data exists in core tables: users (11), merchants (5), products (15), orders (4), order_items (11), transactions (3).
- Role distribution: 3 active consumers, 5 active merchants, 3 active drivers.
- `order_locations` currently has 0 rows. This is not by itself proof of failure, but it means persisted live-order location history has not been demonstrated by current data.
- Realtime publication includes `orders`, `order_locations`, `driver_locations`, `merchants`, `products`, and related user/order tables.
- Before this remediation, migration history contained only `20260727210502_remote_schema`; the repository also contained a separate older geospatial migration, so local/remote migration drift needs deliberate reconciliation.

## Change applied and verified

Applied Supabase migration `20261019053950_add_foreign_key_indexes` and tracked it in this repository as `supabase/migrations/20261019053950_add_foreign_key_indexes.sql`. It adds 16 indexes covering foreign keys flagged by the performance advisor. A follow-up query confirmed all 16 indexes exist. The follow-up performance advisor no longer reports the previous unindexed-foreign-key finding. A second migration, `20261019054334_harden_trigger_functions`, pins an empty search path and revokes direct `anon`/authenticated execution for the trigger-only `products_broadcast_trigger()` and `update_updated_at_column()` functions. Verification confirmed both no longer have direct execute privileges for those roles, and a transaction-scoped product update/rollback completed successfully.

## Remaining issues found

### Security — high priority

1. `public.promotions` has RLS disabled and currently has no policies. Enabling RLS without a matching access policy would break promotion reads/writes; policies must be designed and tested against the actual identity model before changing production.
2. `public.spatial_ref_sys` also has RLS disabled. It is PostGIS-managed, so do not blindly enable RLS on it; review exposed-schema/table grants and PostGIS requirements.
3. Six public functions still have mutable `search_path` settings. Two trigger-only functions were hardened in migration `20261019054334_harden_trigger_functions`.
4. Advisor still flags three PostGIS `st_estimatedextent` overloads callable as SECURITY DEFINER functions. Direct RPC execution was revoked from the two app-owned trigger-only functions; extension functions require separate review.
5. Supabase Auth leaked-password protection is disabled. Enable it in Auth security settings.
6. PostGIS is installed in `public`; moving it requires a compatibility review because app SQL/functions use spatial functions.

### Performance and policy quality

- 51 RLS initialization-plan warnings: policies should wrap stable calls such as `auth.uid()` in `(select auth.uid())` where appropriate.
- Duplicate permissive policies exist on `products`; review and consolidate after confirming expected read/write behavior.
- Two duplicate-index findings exist on `order_locations` and `products`. Do not drop until query/index usage and migration ownership are confirmed.
- The advisor still reports 54 indexes unused. Low usage may simply reflect low traffic; do not drop them based on this signal alone.

### Runtime log signals

The default recent log window contained PostgreSQL errors with SQLSTATE `42703` (undefined column, 100 events) and `22P02` (invalid text representation, 3 events). Edge logs included 44 HTTP 406 events, 4 requests to `/functions/v1/merchants-list` returning 404, and 1 HTTP 400. These counts are signals, not proof that every event is a current app defect. The next diagnostic step is to inspect sanitized samples with timestamps and correlate them to current client requests before changing functions or query schemas.

### Payment processing — critical before accepting real money

The deployed `payment-process` function currently hard-codes `paymentSuccessful = true` and marks transactions/orders paid without a verified Paystack/Stripe result. It also calls Supabase Auth `getUser()` even though the app's email login uses Firebase Auth. Treat this function as unsafe for real payments until the identity integration and provider-side initialization/webhook verification are implemented and tested. Do not treat a client callback as proof of payment.

### Identity model requires confirmation before broad RLS changes

The app uses Firebase Authentication while the database is Supabase Postgres. Current policies frequently use `auth.uid()` against UUID columns, while the app also stores a separate `firebase_uid` text field. Confirm whether Firebase JWTs are configured as trusted third-party JWTs in Supabase and verify the claims mapping. Until that is confirmed, rewriting many RLS policies could either leave data inaccessible or accidentally weaken row ownership checks.

## Recommended next actions

1. Confirm the Firebase-to-Supabase JWT trust/claims configuration and test a consumer, merchant, and driver session against read/write policies.
2. Reconcile local migration files with the actual remote migration history.
3. Add tested RLS policies for promotions and audit all exposed business tables.
4. Revoke direct execution of trigger-only SECURITY DEFINER functions; pin safe search paths on app-owned functions.
5. Fix the recurring SQLSTATE 42703 and 406/404 log events using sanitized examples from the current release.
6. Consolidate duplicate policies/indexes only after checking application usage and expected behavior.
7. Enable leaked-password protection and re-run both Supabase advisors.

## Limitations

This is a static/configuration and aggregated-log audit, not a complete end-to-end test of the live app. It does not prove payment, checkout, driver assignment, or realtime tracking workflows succeed. Those require authenticated role-specific smoke tests with test accounts and test orders. No UI changes were made.
