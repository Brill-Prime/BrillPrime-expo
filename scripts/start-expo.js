#!/usr/bin/env node
const { spawn } = require('child_process');
const net = require('net');

const rawArgs = process.argv.slice(2);
const args = rawArgs.filter((arg) => arg !== '--offline-validation');
const disableDependencyValidation = rawArgs.includes('--offline-validation');
const expoCliPath = require.resolve('expo/bin/cli');

function getArgValue(flag) {
  const equalsArg = args.find((arg) => arg.startsWith(`${flag}=`));
  if (equalsArg) return equalsArg.slice(flag.length + 1);

  const index = args.indexOf(flag);
  if (index >= 0) return args[index + 1];

  return undefined;
}

function hasPortArg() {
  return args.some((arg) => arg === '--port' || arg.startsWith('--port='));
}

function canListenOnPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await canListenOnPort(port)) {
      return port;
    }
  }

  throw new Error(`No available Expo port found from ${startPort} to ${startPort + 19}`);
}

async function main() {
  const startPort = Number.parseInt(
    getArgValue('--port') || process.env.EXPO_START_PORT || '8081',
    10
  );

  if (!Number.isFinite(startPort)) {
    throw new Error('Expo start port must be a number.');
  }

  if (!hasPortArg()) {
    const availablePort = await findAvailablePort(startPort);
    args.push('--port', String(availablePort));
    console.log(`Starting Expo on available port ${availablePort}`);
  }

  const child = spawn(process.execPath, [expoCliPath, 'start', ...args], {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      CI: process.env.CI || '1',
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
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
