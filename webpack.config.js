/*
 *   Webpack config script for Privacy Shield development
 */

"use strict";

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const SRC_DIR = path.resolve(__dirname, "src");
const DIST_DIR = path.resolve(__dirname, "dist");

const buildPlugins = [
  new CopyPlugin([
    {
      from: SRC_DIR,
      to: DIST_DIR,
      ignore: ["*.js", "*.css"],
    },
    {
      from: `${SRC_DIR}/css`,
      to: `${DIST_DIR}/css`,
    },
    {
      from: `${SRC_DIR}/js`,
      to: `${DIST_DIR}/js`,
      ignore: ["webrequest.js"],
    },
  ]),
];

const config = {
  entry: {
    webrequest: [`${SRC_DIR}/js/webrequest.js`],
  },
  output: {
    path: `${DIST_DIR}/js`,
    filename: "[name].js",
  },
  plugins: buildPlugins,
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    config.devtool = "cheap-module-source-map"; // https://stackoverflow.com/questions/48047150/refused-to-evaluate-a-string-as-javascript-because-unsafe-eval-is-not-an-allow
  }

  return config;
};
