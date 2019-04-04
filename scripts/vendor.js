const exec = require("child_process").execFileSync;

const getLibs = (mode, moreLibs) => {
  let REACT_ENV = "development";
  let APPEND_MIN = "";
  if (mode === "production") {
    REACT_ENV = "production.min";
    APPEND_MIN = ".min";
  }

  const prefix = __dirname + "/../node_modules/";

  return {
    axios: `${prefix}axios/dist/axios${APPEND_MIN}.js`,
    moment: `${prefix}moment/min/moment.min.js`,
    Promise: `${prefix}promise-polyfill/dist/polyfill${APPEND_MIN}.js`,
    React: `${prefix}react/umd/react.${REACT_ENV}.js`,
    ReactDOM: `${prefix}react-dom/umd/react-dom.${REACT_ENV}.js`,
    ReactRouterDOM: `${prefix}react-router-dom/umd/react-router-dom${APPEND_MIN}.js`,
    ...moreLibs
  };
};

module.exports = (webpackConfig, moreOptions) => {
  const libs = getLibs(webpackConfig.mode, moreOptions.vendor || {});

  const result = exec(__dirname + "/vendor.sh", [
    webpackConfig.output.path,
    Object.values(libs).join(" ")
  ])
    .toString()
    .trim();

  if (result) {
    console.error(result);
    process.exit(1);
  }

  return Object.keys(libs).reduce((o, k) => {
    o[libs[k].replace(/.+\/node_modules\//, "").split("/")[0]] = k;
    return o;
  }, {});
};
