const path = require('path');
const argv = require('yargs-parser')(process.argv.slice(2));
const { appendPluginDefinition } = require('./plugins');

function normaliseConfigList(configList) {
  if (configList) {
    if (Array.isArray(configList)) {
      return configList;
    }
    return [configList];
  }
  return [];
}

function readConfig() {
  const configList = require(path.resolve(argv.c || 'config.js'));
  const normalisedConfigList = normaliseConfigList(configList);
  // console.trace('Config', config);
  return Promise.all(normalisedConfigList.map(appendPluginDefinition));
}

module.exports = {
  readConfig,
};
