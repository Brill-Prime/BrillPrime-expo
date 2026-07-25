#!/usr/bin/env node
const { spawn } = require('child_process');

const rawArgs = process.argv.slice(2);
// Filter out our custom flags
const args = rawArgs.filter(
  (arg) => arg !== '--offline-validation' && arg !== '--skip-validation'
);

// Always skip dependency validation on Replit / web builds.
// Many native-only packages (expo-notifications, expo-local-authentication, etc.)
// fail the check even when installed because their native modules aren't linked
// in a web-only environment.  The env var suppresses that check.
const env = {
  ...process.env,
  EXPO_NO_DEPENDENCY_VALIDATION: '1',
};

const expoCliPath = require.resolve('expo/bin/cli');

const child = spawn(process.execPath, [expoCliPath, 'start', ...args], {
  stdio: 'inherit',
  shell: false,
  env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
