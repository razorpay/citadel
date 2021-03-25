const hljs = require('highlight.js');
const markdownIt = require('markdown-it');
const deflist = require('markdown-it-deflist');
const anchor = require('markdown-it-anchor');
const customHtml = require('./html_block');
const customFence = require('./fence');
const customLink = require('./custom-link');

hljs.registerLanguage('curl', require('highlight.js/lib/languages/bash'));

let openTags;
let anchors;
const tokenFn = (state) => (type, tag, nesting, opts) => {
  const token = new state.Token(type, tag, nesting);
  if (opts) return Object.assign(token, opts);
  return token;
};

const renderPermalink = (slug, opts, state, idx) => {
  const href = opts.permalinkHref(slug, state);
  const token = tokenFn(state);
  const linkTokens = [
    token('link_open', 'a', 1, {
      attrs: [
        ['class', 'header-link'],
        ['href', href],
        ['name', href.slice(1)],
      ],
    }),
    ...state.tokens[idx + 1].children,
    token('html_inline', '', 0, {
      content: `<span class='header-anchor'>${opts.permalinkSymbol}</span>`,
    }),
    token('link_close', 'a', -1),
  ];
  const tag = state.tokens[idx].tag;
  if (tag === 'h2' || tag === 'h1') {
    anchors.push({
      href,
      level: tag.slice(1),
      title: state.tokens[idx + 1].children
        .filter(
          (token) => token.type === 'text' || token.type === 'code_inline'
        )
        .reduce((acc, t) => acc + t.content, ''),
    });
    const wrapper = tag === 'h2' ? 'section' : 'article';
    if (openTags.hasOwnProperty(wrapper)) {
      if (tag === 'h1' && openTags.section) {
        state.tokens.splice(
          idx++,
          0,
          token('html_inline', '', 0, { content: `</section>` })
        );
      }
      state.tokens.splice(
        idx++,
        0,
        token('html_inline', '', 0, { content: `</${wrapper}>` })
      );
    } else {
      openTags[wrapper] = true;
    }
    state.tokens.splice(
      idx,
      0,
      token('html_inline', '', 0, { content: `<${wrapper}>` })
    );
  }
  state.tokens[idx + 2].children = linkTokens;
};

function getMd(config) {
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
    .disable(['table', 'lheading', 'hr', 'html_block'])
    .use(deflist)
    .use(anchor, {
      permalink: true,
      permalinkSymbol: '🔗',
      slugify: (s) =>
        s
          .toLowerCase()
          .split(/\s+/g, 8)
          .join('-')
          .replace(/[^-\w]/g, ''),
      renderPermalink,
    });

  md.block.ruler.before('heading', 'custom_html_block', customHtml(md));
  md.block.ruler.at('fence', customFence(md));
  const normalizeLink = md.normalizeLink;
  md.normalizeLink = (url) => {
    //rewrite url
    console.log('link ', url);
    const customUrl = customLink(url, config);
    console.log('Normalize link ', customUrl);
    return normalizeLink(customUrl);
  };
  return md;
}

module.exports = (config) => {
  const md = getMd(config);
  return (content) => {
    openTags = {};
    anchors = [];
    content = md.render(content);
    return {
      anchors,
      content,
    };
  };
};
