const yaml = require('js-yaml');
const { exec } = require('child_process');
const fs = require('fs').promises;

async function createRedirects(config) {
  const BASE_PATH = config.basePath + config.publicPath;
  const DIST_DIR = config.dist;
  const REDIRECTS_FILE_PATH = process.env.PWD + '/' + config.redirects;
  const redirectContent = await fs.readFile(REDIRECTS_FILE_PATH);
  const redirects = yaml.load(redirectContent);
  await Promise.all(
    Object.keys(redirects).map(async (origin) => {
      const url = new URL(BASE_PATH + redirects[origin]);
      const html = `<html><head><meta http-equiv="refresh" content="0;URL=${url}"/></head></html>`;
      await exec(`mkdir -p ${DIST_DIR}/${origin}/`);
      await fs.writeFile(`${DIST_DIR}/${origin}/index.html`, html);
    })
  );
}

module.exports = createRedirects;
