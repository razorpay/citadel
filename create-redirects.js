const yaml = require('js-yaml');
const { execSync } = require('child_process');
const fs = require('fs');

function getRedirectPaths(config) {
  if (config.redirects) {
    if (Array.isArray(config.redirects)) {
      return config.redirects;
    }
    return [config.redirects]
  }
  return []
}

function createRedirects(config) {
  const BASE_PATH = config.basePath + config.publicPath;
  const DIST_DIR = config.dist;
  const redictPaths = getRedirectPaths(config);
  const REDIRECT_FILE_PATHS = config.redirects.map(redirect => process.env.PWD + '/' + redirect)
  const yamlContent = REDIRECT_FILE_PATHS.reduce((acc, redirectFilePath) => {
    const content = fs.readFileSync(redirectFilePath);
    return acc + "\n" + content
  }, "")
  const redirects = yaml.load(yamlContent);
  console.log(redirects)
  Object.keys(redirects).map((origin) => {
    const url = new URL(BASE_PATH + redirects[origin]);
    const html = `<html><head><meta http-equiv="refresh" content="0;URL=${url}"/></head></html>`;
    execSync(`mkdir -p ${DIST_DIR}/${origin}/`);
    fs.writeFileSync(`${DIST_DIR}/${origin}/index.html`, html);
  })
}

module.exports = createRedirects;