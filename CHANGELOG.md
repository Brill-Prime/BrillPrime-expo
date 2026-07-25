# Changelog

All notable changes to Brill Prime are documented here.

---

## [Unreleased]

### Infrastructure & Bundler Fixes

#### Metro Bundler — `metro.config.js`
- Added `resolver.blockList` to exclude:
  - `.local/**` — prevents Metro's FallbackWatcher from crashing with `ENOENT` when Replit agent temp directories (`.local/skills/.tmp-*`) are deleted mid-session.
  - `**/__tests__/**`, `*.test.*`, `*.spec.*` — prevents Metro from bundling test files that depend on `@testing-library/react-native` (not installed in a web-only environment).
- Added `resolver.extraNodeModules` to explicitly map all `@firebase/*` sub-packages. Firebase SDK v12 ships `firebase/auth` as an ESM re-export of `@firebase/auth`; Metro could not walk up from the deep ESM path to find the root-level scoped package without this mapping.

#### Workflow Cleanup
- Removed redundant "Frontend" workflow. A single **"Start App"** workflow (`npm run web`, port 5000) is now the only configured workflow and the run button target.

#### npm / `node_modules` Repair
- Identified and removed 232 leftover npm staging temp directories (`.xxx-yyy` pattern) inside `node_modules/` left from an interrupted November 2025 install. These were blocking all `npm install` calls with `ENOTEMPTY` rename errors.
- Reinstalled `react-native-web` which had been partially installed (binary files present but `package.json` missing), causing Expo CLI's dependency validation to fail on startup.

### Auth & Routing (Previous Session)
- **`RoleSwitcher`** — redirects to `/auth/role-selection` with `pendingRoleSwitch` saved in `AsyncStorage` when switching to an unregistered role instead of silently failing.
- **`signin.tsx` / `signup.tsx`** — clears `pendingRoleSwitch` after successful auth and routes to `/home/merchant` or `/home/driver` (not the old `/dashboard/{role}` paths).
- **`role-selection.tsx`** — auto-detects `pendingRoleSwitch` key on mount and auto-continues the role switch flow without requiring manual re-selection.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Expo ~54 / React Native 0.81 |
| Router | expo-router ~6 |
| Auth | Firebase v12 |
| Database / Backend | Supabase |
| Web bundler | Metro |
