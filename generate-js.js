const path = require('path');
const webpack = require('webpack');
const webpackConfigBase = require('./webpack.config');

function generateJs({ config }) {
  const webpackConfig = {
    ...webpackConfigBase,
    plugins: [
      ...webpackConfigBase.plugins,
      new webpack.DefinePlugin({
        ORG: JSON.stringify(config.org),
        PUBLIC_PATH: JSON.stringify(config.publicPath),
        DASHBOARD_URL: JSON.stringify(config.dashboardUrl),
      }),
    ],
    entry: process.env.PWD + '/' + config.js,
    output: {
      path: path.resolve(config.dist),
    },
  };
  webpack(webpackConfig, (err, stats) => {
    if (err) {
      return console.error(err);
    }
    console.log(stats.toString({ colors: true }));
  });
}

module.exports = generateJs;
