const yaml = require('js-yaml');
const { execSync } = require('child_process');
const fs = require('fs');

function getRedirectList(config) {
  if (config.redirects) {
    if (Array.isArray(config.redirects)) {
      return config.redirects;
    }
    return [config.redirects];
  }
  return [];
}

function getRedirectPaths(config) {
  const redictList = getRedirectList(config);
  return redictList.map((redirect) => process.env.PWD + '/' + redirect);
}

function createRedirects(config) {
  const BASE_PATH = config.basePath + config.publicPath;
  const DIST_DIR = config.dist;
  const redirectFilePaths = getRedirectPaths(config);
  const redirectList = redirectFilePaths.reduce((acc, redirectFilePath) => {
    const content = fs.readFileSync(redirectFilePath);
    return acc + '\n' + content;
  }, '');
  const redirects = yaml.load(redirectList);
  Object.keys(redirects).map((origin) => {
    const url = new URL(BASE_PATH + redirects[origin]);
    const html = `<html><head><meta http-equiv="refresh" content="0;URL=${url}"/></head></html>`;
    execSync(`mkdir -p ${DIST_DIR}/${origin}/`);
    fs.writeFileSync(`${DIST_DIR}/${origin}/index.html`, html);
  });
}

module.exports = createRedirects;
