
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for all font and image formats
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2', 'eot', 'svg', 'png', 'jpg', 'jpeg', 'gif');

// Configure platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts.filter(ext => ext !== 'svg'), 'jsx', 'js', 'ts', 'tsx', 'json', 'css'];

// Configure for local development environment with API proxy
config.server = {
  ...config.server,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      logLevel: 'debug'
    }
  }
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