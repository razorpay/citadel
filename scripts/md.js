const hljs = require('highlight.js');
const markdownIt = require('markdown-it');
const deflist = require('markdown-it-deflist');
const anchor = require('markdown-it-anchor');
const renderHtml = require('./custom-html');

hljs.registerLanguage('curl', require('highlight.js/lib/languages/bash'));

let openTags, config;
const tokenFn = state => (type, tag, nesting, opts) => {
  const token = new state.Token(type, tag, nesting);
  if (opts) return Object.assign(token, opts);
  return token;
}

const renderPermalink = (slug, opts, state, idx) => {
  const href = opts.permalinkHref(slug, state);
  const token = tokenFn(state);
  const linkTokens = [
    token('link_open', 'a', 1, {
      attrs: [
        ['class', 'header-link'],
        ['href', href],
        ['name', href.slice(1)],
      ]
    }),
    ...state.tokens[idx + 1].children,
    token('html_inline', '', 0, { content: `<span class='header-anchor'>${opts.permalinkSymbol}</span>`}),
    token('link_close', 'a', -1),
  ]
  const tag = state.tokens[idx].tag;
  if (tag === 'h2' || tag === 'h1') {
    const wrapper = tag === 'h2' ? 'section' : 'article';
    if (openTags.hasOwnProperty(wrapper)) {
      if (tag === 'h1' && openTags.section) {
        state.tokens.splice(idx++, 0, token('html_inline', '', 0, { content: `</section>`}));
      }
      state.tokens.splice(idx++, 0, token('html_inline', '', 0, { content: `</${wrapper}>`}));
    } else {
      openTags[wrapper] = true;
    }
    state.tokens.splice(idx, 0, token('html_inline', '', 0, { content: `<${wrapper}>`}));
  }
  state.tokens[idx + 2].children = linkTokens;
}

const md = markdownIt({
  html: true,
  langPrefix: 'lang lang-',
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (e) {}
    }
    return str;
  },
})
.disable(['table', 'lheading', 'hr'])
.use(deflist)
.use(anchor, {
  permalink: true,
  permalinkSymbol: '🔗',
  slugify: s => s.toLowerCase().split(/\s+/g, 8).join('-').replace(/[^-\w]/g, ''),
  renderPermalink,
});

md.renderer.rules.html_block = function(tokens, idx) {
  return renderHtml(tokens, idx, config, md);
};

md.renderer.rules.fence = function(tokens, idx, options) {
  const token = tokens[idx];
  const lang = token.info.split(':')[0];
  const code = options.highlight(token.content, lang);
  return `<pre class='codeblock'><div class='code-container'><span class='copy-btn'>Copy</span><code>${code}</code></div></pre>`
}

module.exports = (content, _config) => {
  openTags = {};
  config = _config;
  return md.render(content);
}
