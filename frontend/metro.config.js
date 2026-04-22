const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support CSS imports for leaflet on web
config.resolver.sourceExts.push('css');

module.exports = config;
