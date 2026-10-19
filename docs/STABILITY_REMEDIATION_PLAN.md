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
