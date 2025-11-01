
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Enable expo-router
config.resolver.resolverMainFields = ['expo-router-entry', 'browser', 'main'];

// Add support for all font and image formats
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2', 'eot', 'svg', 'png', 'jpg', 'jpeg', 'gif');

// Configure platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts.filter(ext => ext !== 'svg'), 'jsx', 'js', 'ts', 'tsx', 'json', 'css'];

// Configure for local development environment with API proxy
// Note: server.proxy is not a valid option in Metro config
// We'll need to set up the proxy in a different way if needed
config.server = {
  ...config.server
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