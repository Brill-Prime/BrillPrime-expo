# Brill Prime Stability and Quality Remediation Plan

## Scope and guardrails
Prioritize correctness, security, and release confidence. This is not a UI/UX redesign: do not change layouts, colors, typography, copy, or existing screen flows. Work in small commits on a feature branch and merge through review. Do not delete generated/configuration directories until import/build usage is verified.

## Phase 0 — Protect credentials (P0, immediate)
- Rotate/revoke credentials committed in environment files, including service-account keys and database passwords.
- Review access logs and reduce service-account privileges.
- Keep privileged secrets out of the mobile bundle; only public client configuration may be exposed.
- Coordinate Git-history cleanup after rotation. Deleting a file in a new commit does not remove it from old commits.
- Verify ignore rules and EAS/CI variables without printing secret values.
Exit criteria: exposed credentials revoked, replacements stored securely, history-remediation decision documented.

## Phase 1 — Authentication/session consistency (P0)
- Align startup routing and AuthContext on expiry and role validity.
- Resolve the user's trusted backend role; do not use AsyncStorage's selected role as authorization.
- Review sign-out and token refresh behavior.
- Add tests for expired/missing/malformed expiry, supported roles, missing role, sign-out, and returning-user routing.

Implementation: AuthContext requires a token, a finite future expiry timestamp, and one supported role before marking a session authenticated. Email sign-in resolves role and active status from the backend profile and rejects unsupported/inactive accounts.

## Phase 2 — Startup routing safety (P1)
- Keep startup redirects centralized in app/index.tsx; avoid competing root-layout redirects.
- Test first launch, returning signed-out users, valid/expired sessions, and unknown roles.
- Ensure async cleanup/navigation does not run after unmount.
Exit criteria: route matrix passes without redirect loops.

## Phase 3 — Type safety and dependency integrity (P1)
- Run npm ci, npm run typecheck, and npx expo-doctor on the branch.
- Treat TODO_FIX_TYPECHECK.md as a historical tracker, not proof of current errors.
- Fix errors in small domain/API-contract groups; avoid broad any casts.
- Review server-only dependencies against imports and bundle output before removal.
- Check Expo SDK compatibility and lockfile consistency.
Exit criteria: clean install, zero TypeScript errors, and no unexplained Expo Doctor warnings.

## Phase 4 — Regression coverage (P1)
- Add tests for auth/role routing, cart/checkout calculations, payment outcomes, order transitions, driver assignment, and realtime subscription cleanup.
- Add CI checks for typecheck and tests; keep secrets out of logs/artifacts.
- Validate development and preview builds separately.
Exit criteria: CI passes and critical consumer/merchant/driver flows have documented test cases.

## Phase 5 — Order/payment reliability (P0)
- Validate legal order-state transitions server-side.
- Make payment confirmation idempotent and server-verified; never trust client-only payment success.
- Ensure driver assignment, pickup, delivery, and tracking updates are authorized and auditable.
- Handle realtime disconnects/retries without redesigning the UI.
Exit criteria: tests cover duplicate/out-of-order events, failed payments, reconnects, and unauthorized updates.

## Phase 6 — Repository cleanup and documentation (P2)
- Maintain a root README with setup, environment guidance, commands, EAS profiles, tests, and architecture.
- Remove only confirmed unused backups/generated artifacts/machine-specific files.
- Preserve generated code and tool configuration while referenced.
- Review logs and source maps for PII/secrets.
Exit criteria: every deletion has a usage check and setup is reproducible.

## Release checklist
1. Credential rotation/history decision completed.
2. npm ci succeeds.
3. npm run typecheck succeeds.
4. npm test -- --runInBand succeeds.
5. npx expo-doctor reviewed.
6. Development build passes fresh-install and upgrade smoke tests.
7. Consumer, merchant, and driver authentication/role routing verified.
8. Checkout/payment and order lifecycle tested against a non-production backend.
9. Preview build approved before production.

## Current limitations
This GitHub editing session cannot install dependencies or run the app/Android tests. Validate locally or in CI before production release. No passing npm/Jest/typecheck/Expo Doctor/device-test result is claimed.

## Execution update — 19 October 2026

### Completed in GitHub and Supabase
- [x] Email sign-in now reads the backend profile and only accepts the supported `consumer`, `merchant`, or `driver` roles; inactive and unsupported accounts are rejected.
- [x] Added 16 indexes for foreign-key coverage and verified them in Supabase.
- [x] Added the database audit report at `docs/SUPABASE_DATABASE_AUDIT_2026-10-19.md`.
- [x] Deployed the missing `merchants-list` Edge Function and added its source to the repository deployment/check scripts.
- [x] **Payment safety:** deployed `payment-process` version 4 and merged the fail-closed code into `Working-copy`. The old fake-success branch is gone. The endpoint returns `503 PAYMENT_PROVIDER_NOT_CONFIGURED` and does not write transactions or mark orders paid. This is intentionally disabling payments until a verified Paystack/provider flow is implemented.
- [x] **RLS/Firebase identity mapping:** added a private helper mapping a Firebase JWT subject to the BrillPrime UUID profile ID; updated the 61 public RLS policies that used `auth.uid()`; preserved raw Firebase-sub comparisons where policies check `users.firebase_uid`; and restricted notification SELECT to the current user's own notifications.
- [x] Verified that 0 of 75 public-schema policies still directly use `auth.uid()`. A database assertion using an existing user mapping passed without returning personal data. A nonexistent Firebase subject correctly resolves to NULL.
- [x] **Database function hardening:** pinned `search_path` on six application-owned functions and verified the settings in `pg_proc`.
- [x] Wrapped JWT claim access in a stable helper for RLS policies. The Supabase performance advisor no longer reports `auth_rls_initplan`; current performance findings are 54 unused-index INFO notices, 9 multiple-permissive-policy warnings, and 2 duplicate-index warnings.
- [x] Merged the payment safety, database function search-path, and Firebase/RLS migration changes into `Working-copy`.

### Still requires manual configuration or additional testing
- [ ] **Firebase/Supabase trust:** configure/verify Firebase under Supabase **Authentication → Sign In / Providers → Third-Party Auth** and ensure Firebase ID tokens include the `role: authenticated` custom claim. This cannot be safely completed from the available Supabase connector because Firebase Admin credentials and dashboard integration controls are not available here. Until this is configured, authenticated app requests may fail closed. Follow the official guide: https://supabase.com/docs/guides/auth/third-party/firebase-auth
- [ ] **Leaked-password protection:** enable it in Supabase Auth password/security settings. The current connector can inspect advisors but does not expose the Auth security-setting mutation.
- [ ] **PostGIS-managed findings:** the advisor still reports RLS disabled on `public.spatial_ref_sys`, PostGIS installed in `public`, and three `st_estimatedextent` SECURITY DEFINER overloads. An attempt to enable RLS on `spatial_ref_sys` was rejected because the current database role does not own this extension-managed table. Do not change ownership or move PostGIS blindly; review with an appropriately privileged database owner and test geospatial functions first. The RPC grant warning also remains and is not marked resolved.
- [ ] Inspect sanitized examples for SQLSTATE `42703`, SQLSTATE `22P02`, and HTTP `406` from the Supabase logs after Firebase third-party auth is configured.
- [ ] Reconcile migration history and the older geospatial migration before further production schema changes.
- [ ] Run npm install/CI checks, Jest, TypeScript, Expo Doctor, and authenticated consumer/merchant/driver smoke tests.
- [ ] Complete provider integration: server-side initialization and verification, signature-checked webhooks, amount/currency checks, idempotency, and order ownership checks. Do not re-enable payment success until these tests pass.

**Production safety:** Payment processing is currently unavailable by design. The Firebase/RLS mapping is applied and fails closed for unknown users, but the Firebase third-party provider/custom-claim setup still needs verification. No full app build or end-to-end test suite has been run in this session.
