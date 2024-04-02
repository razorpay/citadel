/**
 * Problem 
 * CMS content and direct changes that are done in src/routes trigger 2 separate deploy actions and due to which, search.json of one workflow is overridden by the other
 * Due to this CMS pages changes don't show up in search results
 * Solution 
 * adds script for building seach.json file independently from the file build folder
 */
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
    let content = atRules(doc.body, config, doc.key);
    // trim the content to remove extra empty lines and spaces
    // if content is not trimmed, then this results in incorrect interpretation of indentation resulting
    // resulting in errors like adding codeblocks whenver indentation > 3 etc.
    const trimmedContent = content.split('\n').map(line => line.trim()).join('\n')
    const parsedContent = markdown(trimmedContent, config);
    const parsedContentWithFrontmatter = {
      ...parsedContent,
      ...doc.frontMatter,
      body: content,
      href: doc.href,
      content: parsedContent.content.split('\n').join(''),
    };
    applyPlugin({ plugin, content: parsedContentWithFrontmatter, config });
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