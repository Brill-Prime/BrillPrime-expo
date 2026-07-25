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
  '@firebase/app': path.resolve(__dirname, 'node_modules/@firebase/app'),
  '@firebase/firestore': path.resolve(__dirname, 'node_modules/@firebase/firestore'),
  '@firebase/storage': path.resolve(__dirname, 'node_modules/@firebase/storage'),
  '@firebase/analytics': path.resolve(__dirname, 'node_modules/@firebase/analytics'),
  '@firebase/app-check': path.resolve(__dirname, 'node_modules/@firebase/app-check'),
  '@firebase/functions': path.resolve(__dirname, 'node_modules/@firebase/functions'),
  '@firebase/messaging': path.resolve(__dirname, 'node_modules/@firebase/messaging'),
  '@firebase/database': path.resolve(__dirname, 'node_modules/@firebase/database'),
  '@firebase/util': path.resolve(__dirname, 'node_modules/@firebase/util'),
};

module.exports = config;
