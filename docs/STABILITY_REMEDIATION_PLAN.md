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
- Replace the hardcoded consumer role at email sign-in with the authenticated user's trusted backend profile; do not use AsyncStorage's selected role as authorization.
- Review sign-out and token refresh behavior.
- Add tests for expired/missing/malformed expiry, supported roles, missing role, sign-out, and returning-user routing.

Implementation started: AuthContext now requires a token, a finite future expiry timestamp, and one of the supported roles before marking a session authenticated. Invalid session credentials are cleared while selected role/email are preserved for the existing sign-in flow. No UI changed.

## Phase 2 — Startup routing safety (P1)
- Keep startup redirects centralized in app/index.tsx; avoid competing root-layout redirects.
- Test first launch, returning signed-out users, valid/expired sessions, and unknown roles.
- Ensure async cleanup/navigation does not run after unmount.
Exit criteria: route matrix passes without redirect loops.

## Phase 3 — Type safety and dependency integrity (P1)
- Run npm ci, npm run typecheck, and npx expo-doctor on the branch.
- Treat TODO_FIX_TYPECHECK.md as a historical tracker, not proof of current errors.
- Fix errors in small domain/API-contract groups; avoid broad any casts.
- Review firebase-admin, SendGrid, Supabase CLI/admin-generated packages, and server-only dependencies against imports and bundle output before removal.
- Check Expo SDK compatibility and lockfile consistency.
Exit criteria: clean install, zero TypeScript errors, and no unexplained Expo Doctor warnings.

## Phase 4 — Regression coverage (P1)
- Add tests for auth/role routing, cart/checkout calculations, payment outcomes, order transitions, driver assignment, and realtime subscription cleanup.
- Add CI checks for typecheck and tests; keep secrets out of logs/artifacts.
- Validate development and preview builds separately.
Exit criteria: CI passes and critical consumer/merchant/driver flows have documented test cases.

## Phase 5 — Order/payment reliability (P2)
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
This GitHub editing session cannot install dependencies or run the app/Android tests. Validate locally or in CI before merging.

## Execution update — 19 October 2026

- [x] Email sign-in now waits for the Supabase user profile and accepts only the server-stored `consumer`, `merchant`, or `driver` role. It no longer silently defaults every email login to consumer, and it rejects inactive or unsupported roles.
- [x] Supabase project health, schema, migrations, RLS, Realtime publication, extensions, security/performance advisors, and aggregated recent logs were inspected.
- [x] Added 16 indexes flagged for missing foreign-key coverage. Migration `20261019053950_add_foreign_key_indexes` was applied to Supabase and all 16 indexes were verified afterward.
- [x] Added the database audit report at `docs/SUPABASE_DATABASE_AUDIT_2026-10-19.md`.
- [x] Deployed the missing public `merchants-list` Edge Function and tracked its source; added it to deployment/check scripts. It still needs an end-to-end request from the app.
- [ ] Critical payment safety fix: the live `payment-process` function currently simulates success and marks orders paid without provider verification, and it expects Supabase Auth despite the app using Firebase. Replace this with a verified provider flow before accepting real payments.
- [ ] Run typecheck, Jest, Expo Doctor, and device/web smoke tests. The GitHub/EAS status was still pending at the time of this audit; no passing test result is claimed.
- [ ] Configure/verify the Firebase third-party Auth integration in the Supabase dashboard and ensure Firebase users have the `role: authenticated` custom claim.
- [ ] Replace remaining RLS policies that compare Firebase `sub` values with UUID `auth.uid()` values, using a reviewed ownership mapping and role-specific smoke tests.
- [ ] Address remaining Supabase security advisor findings (PostGIS RPC grants/schema, leaked-password protection, and remaining mutable search paths) and inspect sanitized SQLSTATE 42703 / HTTP 406 log samples. The missing `merchants-list` endpoint is now deployed; verify it end-to-end from the app.
- [ ] Reconcile migration history and the repository's older geospatial migration before further production schema changes.
- [ ] Run authenticated consumer, merchant, and driver tests for sign-in, checkout, payment, order state transitions, driver assignment, and live tracking.

**Production safety note:** No RLS policy, payment, order, or location data was changed as part of this pass. The remaining RLS findings are important, but the Firebase/Supabase identity mapping must be confirmed first to avoid locking out valid users or creating an authorization bypass.
