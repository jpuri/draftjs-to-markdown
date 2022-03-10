var path = require("path");
var webpack = require("webpack");

module.exports = {
  devtool: "source-map",
  mode: 'production',
  entry: ["./js/index"],
  output: {
    path: path.join(__dirname, "../lib"),
    filename: "draftjs-to-markdown-v2.js",
    library: "draftjsToMarkdownV2",
    libraryTarget: "umd"
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{ loader: "babel-loader" }],
        include: path.join(__dirname, "../js")
      }
    ]
  }
};
