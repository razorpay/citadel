'use strict';
const glob = require('glob').sync;
const argv = require('yargs-parser')(process.argv.slice(2));
const { getFormattedDoc } = require('./build-helpers');
const { getDocumentsRoot, getDocumentsGlob } = require('./fs-helpers');
const createRedirects = require('./create-redirects');
const { readConfig } = require('./read-config');
const path = require('path');

const isServer = argv._.indexOf('serve') !== -1;
const isSearch = argv._.indexOf('build-search') !== -1;
const shouldCreateRedirects = argv._.indexOf('create-redirect') !== -1;

const { serve, build } = require('./server');
const { buildSearch } = require('./build-search');

const markdownExtension = '.md';
readConfig().then((configs) => {
  if (isSearch) {
    return buildSearch(configs);
  } else {
    return Promise.all(
      configs.map(async (config) => {
        await compile(config);
      })
    );
  }
});

async function compile(config) {
  const filePathsDontExist = [];
  const documentsRoot = getDocumentsRoot(config);
  const getKey = (path) =>
    path.slice(documentsRoot.length + 1, -markdownExtension.length);
  const getPath = (key) => documentsRoot + (key.startsWith('/')?'':'/') + key + markdownExtension;
  const allDocs = {};
  const getDoc = await getFormattedDoc({ allDocs, getPath, config, filePathsDontExist });

  if (shouldCreateRedirects) {
    createRedirects(config);
    return;
  }
  if (isServer) {
    serve({
      config,
      getDoc,
      getPath,
      getKey,
      allDocs,
      filePathsDontExist,
    });
  } else {
    build({
      config,
      getDoc,
      docs: glob(getDocumentsGlob(config, markdownExtension)),
      getKey,
      allDocs,
      filePathsDontExist,
    });
  }
}
