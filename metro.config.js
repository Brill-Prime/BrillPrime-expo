const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for fonts
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Block problematic packages
config.resolver.blockList = [
  /node_modules\/@tybys\/wasm-util\/lib\/mjs/,
];

// Block native-only modules on web
const webBlockList = [
  'react-native-maps',
  'react-native-maps-directions',
  'react-native-otp-verify',
  'react-native-paystack-webview',
  'react-native-view-shot'
];

const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && webBlockList.includes(moduleName)) {
    return {
      type: 'empty',
    };
  }
  
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;