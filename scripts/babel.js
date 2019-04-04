const commonPlugins = [
  // ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
  ["@babel/plugin-proposal-pipeline-operator", { proposal: "minimal" }],
  ["@babel/plugin-proposal-class-properties", { loose: true }],
  "transform-react-jsx"
];

const devPlugins = [
  "@babel/plugin-transform-react-display-name",
  "@babel/plugin-transform-react-jsx-self",
  "@babel/plugin-transform-react-jsx-source"
];

const prodPlugins = [];

module.exports = isProd => {
  return {
    loader: "babel-loader",
    options: {
      babelrc: false,
      plugins: commonPlugins.concat(isProd ? prodPlugins : devPlugins)
    }
  };
};
