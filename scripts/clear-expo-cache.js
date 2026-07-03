#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const tempRoot = os.tmpdir();

const explicitTargets = [
  path.join(projectRoot, '.expo'),
  path.join(projectRoot, 'node_modules', '.cache'),
];

const tempPrefixes = ['metro-', 'haste-map-', 'react-', 'expo-'];

function removeTarget(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`Removed ${targetPath}`);
  } catch (error) {
    console.warn(`Could not remove ${targetPath}: ${error.message}`);
  }
}

for (const target of explicitTargets) {
  removeTarget(target);
}

try {
  for (const entry of fs.readdirSync(tempRoot)) {
    if (tempPrefixes.some((prefix) => entry.startsWith(prefix))) {
      removeTarget(path.join(tempRoot, entry));
    }
  }
} catch (error) {
  console.warn(`Could not scan temp cache directory ${tempRoot}: ${error.message}`);
}

console.log('Expo and Metro cache cleanup complete. Start Expo with --clear next.');
