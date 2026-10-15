#!/usr/bin/env node
const { spawn } = require('child_process');

const rawArgs = process.argv.slice(2);
// Filter out our custom flags
const args = rawArgs.filter(
  (arg) => arg !== '--offline-validation' && arg !== '--skip-validation'
);

const env = {
  ...process.env,
  EXPO_NO_DOTENV: '1',
  EXPO_NO_TYPESCRIPT_SETUP: '1',
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
