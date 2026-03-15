const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const dotenv = require("dotenv");

module.exports = (env, argv) => {
  const mode = argv.mode || "development";
  const envFile =
    mode === "production" ? "./.env.production" : "./.env.development";
  dotenv.config({ path: envFile });

  console.log("Using API URL:", process.env.REACT_APP_API_URL);

  return {
    entry: "./src/index.js",
    output: {
      filename: "[name].[contenthash].js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.js$/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        },
      ],
    },
    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react-vendor",
            chunks: "all",
            priority: 30,
          },
          auth0: {
            test: /[\\/]node_modules[\\/](@auth0)[\\/]/,
            name: "auth0-vendor",
            chunks: "all",
            priority: 20,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
        },
      },
      runtimeChunk: "single",
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
      }),
      new webpack.DefinePlugin({
        "process.env.REACT_APP_API_URL": JSON.stringify(
          process.env.REACT_APP_API_URL,
        ),
        "process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_DOMAIN": JSON.stringify(
          process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_DOMAIN,
        ),
        "process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_CLIENT_ID":
          JSON.stringify(
            process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_CLIENT_ID,
          ),
        "process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_AUDIENCE":
          JSON.stringify(
            process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_AUDIENCE,
          ),
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "public"),
      },
      port: 3030,
      hot: true,
      headers: {
        "Cache-Control": "max-age=31536000",
      },
    },
    performance: {
      hints: false,
    },
    mode,
  };
};
