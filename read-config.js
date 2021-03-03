const { getPluginsRoot, cfs } = require('./fs-helpers');
const { appendPluginDefinition } = require('./plugins'); 

function readConfig() {
  const config = require(path.resolve(argv.c || 'config.js'));
  return appendPluginDefinition(config);
}

module.exports = {
  readConfig,
};
