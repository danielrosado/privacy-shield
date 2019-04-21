/* eslint-disable max-len */

/*
 *   Webpack config script for Privacy Shield development
 */

'use strict';

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');

const SRC_DIR = path.resolve(__dirname, 'src');
const DIST_DIR = path.resolve(__dirname, 'dist');

const buildPlugins = [
  new CopyPlugin([
    {
      from: `${SRC_DIR}`,
      to: `${DIST_DIR}`,
      ignore: ['js/classes/*.js', 'js/utils/*.js'],
    },
  ]),
];

const config = {
  entry: {
    background: `${SRC_DIR}/js/background.js`,
    popup: `${SRC_DIR}/js/popup.js`,
  },
  output: {
    path: `${DIST_DIR}/js`,
    filename: '[name].js',
  },
  plugins: buildPlugins,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'cheap-module-source-map'; // https://stackoverflow.com/questions/48047150/refused-to-evaluate-a-string-as-javascript-because-unsafe-eval-is-not-an-allow
    buildPlugins.push(
        new ChromeExtensionReloader({
          port: 9090, // Which port use to create the server
          reloadPage: true, // Force the reload of the page also
          entries: { // The entries used for the content/background scripts
            background: 'background', // *REQUIRED
          },
        })
    );
  }
  return config;
};
