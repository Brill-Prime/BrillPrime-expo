const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Configure for Replit environment - allow all hosts
config.server = {
  ...config.server,
  host: '0.0.0.0',
  port: 5000,
  // Add headers to bypass host verification for Replit proxy
  enhanceMiddleware: (middleware, metroServer) => {
    return (req, res, next) => {
      // Set CORS headers for Replit proxy
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Set longer timeout for requests
      res.setTimeout(30000);
      return middleware(req, res, next);
    };
  },
};

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db'
);

// Add resolver configuration
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'svg', 'ttf'];

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