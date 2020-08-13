const hljs = require('highlight.js');
hljs.registerLanguage('curl', require('highlight.js/lib/languages/bash'));

const twemoji = require('twemoji');

const customHtmlBlock = require('./markdown-it/html_block');
const customHeading = require('./markdown-it/heading');
const customLink = require('./markdown-it/link');
const customFence = require('./markdown-it/fence');

var md = (module.exports = require('markdown-it')({
  html: true,
  breaks: false, // Convert '\n' in paragraphs into <br>
  langPrefix: 'lang lang-',
  linkify: false, // Autoconvert URL-like text to links
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (e) {}
    }
  },
})
  .disable(['table', 'html_block'])
  .use(require('markdown-it-deflist'))
  .use(require('markdown-it-emoji')));

customLink(md);
md.block.ruler.at('fence', customFence(md));
md.block.ruler.before('heading', 'custom_html_block', customHtmlBlock(md));

md.renderer.rules.emoji = function (token, idx) {
  return twemoji.parse(token[idx].content);
};

md.block.ruler.at('heading', customHeading(md));

md.openTag = function (tag, state) {
  md.closeTag(tag, state);
  md.currentFile.openTags[tag] = true;
  state.push('', tag, 1);
};

md.closeTag = function (tag, state) {
  childTags[tag] &&
    childTags[tag].forEach(function (childTag) {
      md.closeTag(childTag, state);
    });
  currentTag = md.currentFile.openTags[tag];
  if (currentTag) {
    if (typeof currentTag === 'string') {
      let rawText = `<${tag}>${currentTag}</${tag}>`;
      if (state) {
        let text = state.push('html_block', '', 0);
        text.rawText = rawText;
      } else {
        return rawText;
      }
    } else {
      if (state) {
        state.push('', tag, -1);
      } else {
        return `</${tag}>`;
      }
    }
  }
  return '';
};

var childTags = {
  article: ['section'],
  section: ['aside'],
};
