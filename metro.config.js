
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db'
);

config.resolver.sourceExts.push(
  'jsx',
  'js', 
  'ts', 
  'tsx',
  'json',
  'wasm',
  'svg'
);

module.exports = config;
