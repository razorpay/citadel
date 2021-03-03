const path = require('path');
const cfs = require('./scripts/cfs');

const getDocumentsRoot = (config) => path.resolve(config.src);
const getPluginsRoot = (config) => path.resolve(config.pluginRoot || '');
const getDocumentsGlob = (config) =>
  `${getDocumentsRoot(config)}/**/*${markdownExtension}`;
const dir = (str) => str.replace(/\/[^/]+$/, '');

module.exports = {
  cfs,
  getDocumentsRoot,
  getDocumentsGlob,
  getPluginsRoot,
};
