const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite
  'db'
);

config.resolver.sourceExts.push('ts', 'tsx');

// Native module stubs for all platforms (e.g. react-native-fs)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-fs': require.resolve('./mocks/react-native-fs.js'),
};

// Web-specific: redirect native-only modules to stubs when bundling for web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const webStubs = {
      'react-native-agora': path.resolve(__dirname, 'mocks/react-native-agora.web.js'),
      '@stripe/stripe-react-native': path.resolve(__dirname, 'mocks/stripe-react-native.web.js'),
      '@tensorflow/tfjs-react-native': path.resolve(__dirname, 'mocks/tfjs-react-native.web.js'),
    };
    if (webStubs[moduleName]) {
      return { filePath: webStubs[moduleName], type: 'sourceFile' };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
