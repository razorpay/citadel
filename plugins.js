const { getPluginsRoot, cfs } = require('./fs-helpers');

const isPluginListDefined = (plugins) =>
  plugins && Array.isArray(plugins) && plugins.length;

function validatePluginDefinition(plugin) {
  const isNameUndefined = !plugin.name;

  if (isNameUndefined) {
    const error = new Error(
      'Plugin validation error: name is not defined, please check plugin definition'
    );
    throw error;
  }

  const requiredOptions = ['init', 'process', 'end'];
  for (let option of requiredOptions) {
    const isOptionDefined = plugin[option];
    if (!isOptionDefined) {
      const error = new Error(
        'Plugin validation error: ' +
          option +
          ' is not defined, please check plugin definition'
      );
      throw error;
    }
    const isOptionNotAFunction = typeof plugin[option] !== 'function';
    if (isOptionNotAFunction) {
      const error = new Error(
        'Plugin validation error: ' +
          option +
          ' is not a function, please check plugin definition'
      );
      throw error;
    }
  }
}

const getPluginPath = ({ plugin, root }) => root + '/' + plugin + '.js';

function getPluginDefinition({ plugin, root }) {
  return new Promise(function getDefinition(resolve, reject) {
    try {
      const getPlugin = require(getPluginPath({ plugin, root }));
      const isFunction = typeof getPlugin === 'function';
      if (isFunction) {
        const definition = getPlugin();
        resolve(definition);
      } else {
        throw new Error('Exported entity for plugin ' + plugin + ' is not a function.');
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function appendPluginDefinition(config) {
  const { plugins } = config;
  if (!isPluginListDefined(plugins)) {
    config.plugins = [];
    return config;
  }

  const root = getPluginsRoot(config);

  config.plugins = (
    await Promise.all(
      plugins.map(async (plugin) => {
        let pluginDefinition;
        try {
          pluginDefinition = await getPluginDefinition({ plugin, root });
        } catch (error) {
          console.error('Error loading plugin ', plugin);
          console.trace(error);
          return null;
        }
        try {
          validatePluginDefinition(pluginDefinition);
          return pluginDefinition;
        } catch (error) {
          console.error(
            'Invalid definition for plugin:  ' + plugin + '. Skipping it.'
          );
          console.trace(error);
          return null;
        }
      })
    )
  ).filter((_) => _);
  return config;
}

function initializePlugin(plugin, config) {
  plugin.init(config);
}

function applyPlugin({ plugin, content, config }) {
  const result = plugin.process(content, config);
  if (!result) {
    const error = new Error(
      'Error processing content: ' +
        plugin.name +
        ' process function should return valid value, please check plugin definition'
    );
    console.error(error);
    return content;
  }
  return result;
}

function cleanupPlugin(plugin) {
  plugin.end();
}

module.exports = {
  appendPluginDefinition,
  initializePlugin,
  applyPlugin,
  cleanupPlugin,
};
