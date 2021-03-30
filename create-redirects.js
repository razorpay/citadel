const yaml = require('js-yaml');
const { execSync } = require('child_process');
const fs = require('fs');

function createRedirects(config) {
  const BASE_PATH = config.basePath + config.publicPath;
  const DIST_DIR = config.dist;
  const REDIRECTS_FILE_PATH = process.env.PWD + '/' + config.redirects;
  const redirectContent = fs.readFileSync(REDIRECTS_FILE_PATH);
  const redirects = yaml.load(redirectContent);
  Object.keys(redirects).map((origin) => {
    const url = new URL(BASE_PATH + redirects[origin]);
    const html = `<html><head><meta http-equiv="refresh" content="0;URL=${url}"/></head></html>`;
    execSync(`mkdir -p ${DIST_DIR}/${origin}/`);
    fs.writeFileSync(`${DIST_DIR}/${origin}/index.html`, html);
  })
}

module.exports = createRedirects;