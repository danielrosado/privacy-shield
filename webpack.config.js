/*
 *   Webpack config script for Privacy Shield
 */

const path = require("path");

const SRC_JS_DIR = path.resolve(__dirname, "src/js");
const BUILD_JS_DIR = path.resolve(__dirname, "dist/js");

const mode = "development";

module.exports = {
  mode: mode,
  devtool: "cheap-module-source-map", // https://stackoverflow.com/questions/48047150/refused-to-evaluate-a-string-as-javascript-because-unsafe-eval-is-not-an-allow
  entry: {
    webrequest: [SRC_JS_DIR + "/webrequest.js"],
  },
  output: {
    path: BUILD_JS_DIR,
    filename: "[name].js",
  },
};
