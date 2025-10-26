const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for all font and image formats
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2', 'eot', 'svg', 'png', 'jpg', 'jpeg', 'gif');

// Configure platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts.filter(ext => ext !== 'svg'), 'jsx', 'js', 'ts', 'tsx', 'json', 'css'];

// Configure for Replit environment
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

// Block react-native-maps from being bundled on web
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
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;