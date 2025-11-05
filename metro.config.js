const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for Ionicons fonts
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Configure platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx', 'json', 'css'];

// Block problematic packages
config.resolver.blockList = [
  /node_modules\/@tybys\/wasm-util\/lib\/mjs/,
];

// Configure for Replit environment with proper CORS
config.server = {
  ...config.server,
  port: 5000,
  rewriteRequestUrl: (url) => {
    // Handle Replit's webview proxy
    return url.replace(/^\/.*?\//, '/');
  },
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set CORS headers for Replit environment
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

// Disable watchman for Replit environment
config.watchFolders = [path.resolve(__dirname)];
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Block react-native-maps from being bundled on web
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'empty',
    };
  }
  if (platform === 'web' && moduleName === 'react-native-maps-directions') {
    return {
      type: 'empty',
    };
  }
  // Use the default resolver
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;