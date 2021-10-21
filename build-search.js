const glob = require('glob').sync;
const { initializePlugin, applyPlugin, cleanupPlugin } = require('./plugins');
const getMarkdown = require('./scripts/md');
const atRules = require('./scripts/at-rules');
const {
  getDocumentsRoot,
  getDocumentsGlob
} = require('./fs-helpers');
const { getFormattedDoc } = require('./build-helpers');

const markdownExtension = '.md';
let plugin = {};

function checkAllowed(key, config) {
  let allow = true;
  config.rules.forEach((rule) => {
    if (key.startsWith(rule.slice(1))) {
      allow = rule[0] === '+';
    }
  });
  return allow;
}

const build = async (config) => {
  const markdown = getMarkdown(config);

  const documentsRoot = getDocumentsRoot(config);
  const getKey = (path) =>
    path.slice(documentsRoot.length + 1, -markdownExtension.length);
    
  const getPath = (key) => documentsRoot + '/' + key + markdownExtension;

  const getDoc = await getFormattedDoc({ allDocs: {}, getPath });

  const docs = glob(getDocumentsGlob(config, markdownExtension));
  
  const docsWithContent = await Promise.all(
    docs
      .map((d) => {
        const key = getKey(d);
        return checkAllowed(key, config) && getDoc(key);
      })
      .filter((_) => _)
  );

  docsWithContent.forEach((doc) => {
    let content = atRules(doc.body, config);
    const parsedContent = markdown(content, config);
    const parsedContentWithFrontmatter = {
      ...parsedContent,
      ...doc.frontMatter,
      body: content,
      href: doc.href,
    };
    applyPlugin({ plugin, content: parsedContentWithFrontmatter });
  });
}

const buildSearch = async (configs) => {
  plugin = configs[0].plugins[0];
  initializePlugin(plugin, configs[0]);
  const promises = configs.map(config => build(config));
  return Promise.all(promises).then(() => {
    cleanupPlugin(plugin);
    return true;
  });
}

module.exports = {
  buildSearch,
};