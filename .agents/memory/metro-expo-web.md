---
name: Metro config for Expo web
description: How to configure metro.config.js to avoid crashes and resolve @firebase/* on Expo web
---

## Rules

1. **Block `.local/` from Metro's watcher** — Replit agent tools create temp directories under `.local/skills/.tmp-*`. Metro's FallbackWatcher watches them and crashes with ENOENT when they're deleted. Add `.local/.*` to `resolver.blockList`.

2. **Block test files** — Metro picks up `__tests__/*.test.tsx` and fails because `@testing-library/react-native` isn't installed in a web-only env. Block `__tests__`, `.test.*`, `.spec.*` patterns.

3. **Add `extraNodeModules` for all `@firebase/*`** — Firebase SDK v12+ ships `firebase/auth/dist/esm/index.esm.js` which just re-exports from `@firebase/auth`. Metro sometimes can't resolve scoped packages from deep paths. Explicitly map all `@firebase/*` sub-packages via `resolver.extraNodeModules`.

**Why:** Metro's module resolution walking up from deep nested paths (e.g. `node_modules/firebase/auth/dist/esm/`) can fail to find root-level scoped packages like `@firebase/auth` even when they're installed.

**How to apply:** Always use this pattern in `metro.config.js` for this project:

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];

config.resolver.blockList = [
  /\.local\/.*/,
  /.*\/__tests__\/.*/,
  /.*\.test\.[jt]sx?$/,
  /.*\.spec\.[jt]sx?$/,
];

config.resolver.extraNodeModules = {
  '@firebase/auth': path.resolve(__dirname, 'node_modules/@firebase/auth'),
  // ... all other @firebase/* packages
};
```
