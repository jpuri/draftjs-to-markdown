var path = require("path");
var webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  devtool: "source-map",
  entry: ["./js/index"],
  output: {
    path: path.join(__dirname, "../lib"),
    filename: "draftjs-to-markdown.js",
    library: "draftjsToMarkdown",
    libraryTarget: "umd"
  },
  optimization: {
    minimizer: [new UglifyJsPlugin()]
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
