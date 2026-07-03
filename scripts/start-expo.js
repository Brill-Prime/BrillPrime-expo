#!/usr/bin/env node
const { spawn } = require('child_process');

const rawArgs = process.argv.slice(2);
const args = rawArgs.filter((arg) => arg !== '--offline-validation');
const disableDependencyValidation = rawArgs.includes('--offline-validation');
const expoCliPath = require.resolve('expo/bin/cli');

const child = spawn(process.execPath, [expoCliPath, 'start', ...args], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    ...(disableDependencyValidation ? { EXPO_NO_DEPENDENCY_VALIDATION: '1' } : {}),
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
