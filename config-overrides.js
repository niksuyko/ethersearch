const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: require.resolve('browserify-fs'),
    path: require.resolve('path-browserify'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert/'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url/'),
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
};
