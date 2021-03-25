const fs = require('fs');
const path = require('path');
const readFileSync = (file) => fs.readFileSync(file, 'utf8');
const noop = () => {};
const cfs = require('./cfs');
const htmlparser = require('htmlparser2');

// block rules are always functions
// called with `md` as context
const blockRules = {
  // use it to comment in markdown
  '//': (a) => '',

  image: function (rest, config) {
    return `<img src="/${config.publicPath}/assets/images/${rest[0]}"/>`;
  },

  // include another markdown
  include: function (rest, config) {
    /* Sample use in *.md files */
    // e.g. @include part1
    return cfs.readSync(`${config.partials}/${rest[0]}.md`);
  },
};

function getAttrs(openTag) {
  let attrs = {};
  const parser = new htmlparser.Parser({
    onopentag(name, _attrs) {
      attrs = _attrs;
    },
  });
  parser.write(openTag);
  parser.end();
  return attrs;
}

module.exports = function (body, config) {
  return body
    .replace(
      /^(\s*)@(\/\/|image|include)(.*)$/gm,
      function (_, indent, rule, rest) {
        rest = rest.split(/\s+/).filter((_) => _);
        return blockRules[rule](rest, config);
      }
    )
    .replace(
      /^(\s*)(<show-if[^>]*>)(.*?)<\/show-if>/gms,
      function (_, indent, openTag, content) {
        attrs = getAttrs(openTag);
        if (config.org === attrs.org) return `${indent}${content}`;
        return '';
      }
    )
    .replace(/^(\s*)<img([^>]*)\/?>/gm, function (openTag, indent) {
      attrs = getAttrs(openTag);
      if (attrs.src) {
        const isInternalImage = attrs.src.startsWith('/docs/');
        if (isInternalImage) {
          attrs.src = attrs.src.replace(/^\/docs\//, config.publicPath);
        }
      }
      attrs.class = 'click-zoom';
      const updatedAttrs = Object.keys(attrs)
        .map((k) => ` ${k}="${attrs[k]}"`)
        .join(' ');
      return `\n${indent}<img${updatedAttrs}>\n`;
    })
    .replace(
      /(\s*)(<a([^>]*?)>)(.*?)<\/a>/gm,
      function (_, indent, openTag, __, content) {
        attrs = getAttrs(openTag);
        if (attrs.href) {
          const isInternalLink = attrs.href.startsWith('/docs/');
          if (isInternalLink) {
            attrs.href = attrs.href.replace(/^\/docs\//, config.publicPath);
          }
        }
        const updatedAttrs = Object.keys(attrs)
          .map((k) => ` ${k}="${attrs[k]}"`)
          .join(' ');
        return `${indent}<a${updatedAttrs}>${content}</a>`;
      }
    );
};
