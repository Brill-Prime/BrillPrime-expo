# Expo Android startup recovery

This project includes helper scripts for the startup failures that commonly block Android development:

- Port collisions such as `Port 8082 is being used by another process`.
- Corrupted Metro file-map/cache data (`Unable to deserialize cloned data`).
- Expo CLI dependency validation failing while offline or behind a VPN/proxy/firewall (`TypeError: fetch failed` from `getNativeModuleVersionsAsync`).

## Start Android normally

```bash
npm run start:android
```

The Android start helper automatically finds an available Expo port when you do not pass `--port`, starting at `EXPO_START_PORT` or `8081` and scanning the next 20 ports. This avoids Expo's interactive "use another port?" prompt when Metro's default port is already occupied.

To prefer a different starting port:

```bash
EXPO_START_PORT=8082 npm run start:android
```

To force a specific port instead of auto-selecting one:

```bash
npm run start:android -- --port 8084
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

## Dependency compatibility

`@react-native-community/netinfo` is pinned to `11.4.1`, matching the Expo compatibility warning for this SDK, instead of allowing npm to float to `11.5.x` through a caret range.

## App routing safeguards

The startup flow normalizes the legacy `selectedRole` AsyncStorage key into the current `userRole` key and routes merchants to `/home/merchant`, which exists in the app. This avoids blank-screen-like redirect loops caused by mismatched role storage keys or redirects to missing routes.

## Web/native map bundling

Native map screens should not import `react-native-maps` directly from Expo Router route files. Route files can still be discovered during web bundling, so map rendering should go through the app's platform-specific `components/Map` abstraction instead of requiring `react-native-maps` in the route module.
