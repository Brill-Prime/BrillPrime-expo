
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enable expo-router and proper module resolution
config.resolver.resolverMainFields = ['expo-router-entry', 'browser', 'main'];
config.resolver.nodeModulesPaths = [__dirname + '/node_modules'];
config.watchFolders = [__dirname + '/node_modules'];

// Add support for all font and image formats
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2', 'eot', 'svg', 'png', 'jpg', 'jpeg', 'gif');

// Configure platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts.filter(ext => ext !== 'svg'), 'jsx', 'js', 'ts', 'tsx', 'json', 'css'];

// Optimize for memory-constrained environments (Replit)
config.maxWorkers = 1;
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

// Exclude heavy native-only modules for web platform
config.resolver.blockList = [
  /node_modules\/@rnmapbox/,
  /node_modules\/react-native-maps/,
];

// Configure for local development environment with API proxy
// Allow all hosts for Replit proxy environment
config.server = {
  ...config.server,
  rewriteRequestUrl: (url) => {
    // Allow requests from any origin (required for Replit proxy)
    return url;
  },
};

// Block react-native-maps from being bundled on web
// And configure path aliases for @ imports
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
  
  // Handle @ path alias
  if (moduleName.startsWith('@/')) {
    const modulePath = moduleName.replace('@/', '');
    return context.resolveRequest(context, path.join(__dirname, modulePath), platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;