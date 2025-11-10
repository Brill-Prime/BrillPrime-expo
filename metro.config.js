const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for Ionicons fonts
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Configure platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx', 'json', 'css'];

// Configure for Replit environment with proper CORS
config.server = {
  ...config.server,
  port: 5000,
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