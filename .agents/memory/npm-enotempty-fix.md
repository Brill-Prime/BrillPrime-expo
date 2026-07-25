---
name: npm ENOTEMPTY fix
description: How to fix npm install failures with ENOTEMPTY rename errors in this project
---

## Problem

`npm install` fails with:
```
npm error ENOTEMPTY: directory not empty, rename 'node_modules/react-native' -> 'node_modules/.react-native-nZ7c84wh'
```

## Root Cause

The `node_modules/` directory accumulated 232+ hidden temp directories (`.acorn-tv69ijyW`, `.agent-base-f1YoG7Ns`, etc.) from a previous interrupted npm install (dated Nov 14, 2025). These leftovers are what npm tries to rename into, causing ENOTEMPTY.

## Fix

```bash
cd node_modules && find . -maxdepth 1 -name '.*' ! -name '.bin' -type d -exec rm -rf {} +
```

Then retry `npm install`.

**Why:** npm v10+ uses atomic renames for package installs. If a previous install was interrupted, it leaves staging directories that block future renames.

**How to apply:** Run the cleanup command any time npm install fails with ENOTEMPTY.
