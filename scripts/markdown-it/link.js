// add target="_blank" to all external links
// https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md

// Remember old renderer, if overriden, or proxy to default renderer

module.exports = function(md) {
  const defaultRender = md.renderer.rules.link_open;

  return function(tokens, idx, options, env, self) {
    var isExternal = false;
    var href = tokens[idx].attrs[tokens[idx].attrIndex('href')];
    if (href) {
      href = href[1];

      // if href starts with `http`, treat as external
      if (!href.indexOf('http')) {
        tokens[idx].attrPush(['target', '_blank']);
      }
    }
    // pass token to default renderer.
    return defaultRender(tokens, idx, options, env, self);
  };
}