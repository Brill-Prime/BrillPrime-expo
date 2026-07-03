# Expo Android startup recovery

This project includes helper scripts for the two startup failures that commonly block Android development:

- Corrupted Metro file-map/cache data (`Unable to deserialize cloned data`).
- Expo CLI dependency validation failing while offline or behind a VPN/proxy/firewall (`TypeError: fetch failed` from `getNativeModuleVersionsAsync`).

## Start Android normally

```bash
npm run start:android
```

## Clear Expo/Metro caches and start Android

```bash
npm run start:android:clear
```

The cache cleaner removes the project `.expo` directory, `node_modules/.cache`, and common OS temp folders used by Metro, Haste, React Native, and Expo.

## Start Android when Expo dependency validation cannot reach the network

```bash
npm run start:android:offline
```

This command performs the same cache cleanup and starts Android with `EXPO_NO_DEPENDENCY_VALIDATION=1`, which lets Expo start without fetching the remote native module compatibility table.

Use this only as a development bypass. When the network is healthy, run `npx expo doctor` or `npx expo install --fix` to verify package compatibility.

## App routing safeguards

The startup flow now normalizes the legacy `selectedRole` AsyncStorage key into the current `userRole` key and routes merchants to `/home/merchant`, which exists in the app. This avoids blank-screen-like redirect loops caused by mismatched role storage keys or redirects to missing routes.
