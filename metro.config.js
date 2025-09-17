const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure for web and enable proper hosting for Replit environment
if (config.server) {
  config.server.host = '0.0.0.0';
} else {
  config.server = { host: '0.0.0.0' };
}

module.exports = config;