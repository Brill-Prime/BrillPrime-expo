const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    mode: env.mode || 'development',
  }, argv);

  // Configure dev server to allow all hosts for Replit proxy
  if (config.devServer) {
    config.devServer.allowedHosts = 'all';
    config.devServer.host = '0.0.0.0';
    config.devServer.port = 5000;
    config.devServer.headers = {
      'Access-Control-Allow-Origin': '*',
    };
  }

  return config;
};