const isPluginListDefined = (plugins) =>
  plugins && Array.isArray(plugins) && plugins.length;

function validatePluginDefinition() {
  const isNameUndefined = !!plugin.name

  if (isNameUndefined) {
    const error = new Error(
      'Plugin validation error: name is not defined, please check plugin definition'
    );
    throw error;
  }

  const requiredOptions = ["init", "process", "end"]
  for (let option in requiredOptions) {
    const isOptionDefined = plugin[option];
    if (!isOptionDefined) {
      const error = new Error(
        "Plugin validation error: " + option + " is not defined, please check plugin definition"
      );
      throw error;
    }
    const isOptionNotAFunction = typeof plugin[option] !== "function";
    if (isOptionNotAFunction) {
      const error = new Error(
        "Plugin validation error: " + option + " is not a function, please check plugin definition"
      );
      throw error;
    }
  }
}

async function appendPluginDefinition(config) {
  const { plugins } = config;
  if (!isPluginListDefined(plugins)) {
    config.plugins = []
    return config;
  }

  const pluginRoot = getPluginsRoot(config);
  const getPluginPath = (plugin) => pluginRoot + "/" + plugin + ".js"

  config.plugins = plugins
    .map((plugin) => {
      let pluginDefinition
      try {
        pluginDefinition = await cfs.read(getPluginPath(plugin));
      } catch (error) {
        console.error("Error loading plugin ", plugin)
        console.trace(error)
        return null;
      }
      try {
        validatePluginDefinition(pluginDefinition);
        return pluginDefinition;
      } catch (error) {
        console.error("Invalid definition for plugin:  " + plugin + ". Skipping it.")
        return null;
      }
    })
    .filter((_) => _);
}

function initializePlugin(plugin) {
  plugin.init();
}

function applyPlugin({plugin, content}) {
  const result = plugin.process(content)
  if (!result) {
    const error = new Error(
      'Error processing content: ' + plugin.name + " process function should return valid value, please check plugin definition"
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
