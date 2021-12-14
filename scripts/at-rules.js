const fs = require('fs');
const cfs = require('./cfs');
const htmlparser = require('htmlparser2');
const customLink = require('./custom-link');
const { getDocumentsRoot } = require('../fs-helpers');

// block rules are always functions
// called with `md` as context
const blockRules = {
  // use it to comment in markdown
  '//': (a) => '',

  image: function (rest, config) {
    return `<img src="${config.publicPath}assets/images/${rest[0]}"/>`;
  },

  // include another markdown
  include: function (rest, config) {
    /* Sample use in *.md files */
    // e.g. @include part1
    const content = cfs.readSync(`${config.partials}/${rest[0]}.md`);
    // adding a space as html elements require a black line before them.
    return `\n${content}`;
  },
};

const requiredAttributesByTags = {
  'a': ['href'],
  'file': ['href'],
  'show-if': ['org'],
  'img': ['src']
};

function getAttrs(openTag, docPath, config) {
  let attrs = {};
  const parser = new htmlparser.Parser({
    onopentag(name, _attrs) {
      validateAttributes(openTag, _attrs, requiredAttributesByTags[name], docPath, config);
      attrs = _attrs;
    },
  });
  parser.write(openTag);
  parser.end();
  return attrs;
}

function validateAttributes(tag = '', userGivenAttributes = {}, requiredAttributes = [], docPath, config) {
  // running it just for razorpay org
  // else validation will run for same files for other orgs as well
  if (config.org !== 'razorpay') return;

  const docFullPath = `${getDocumentsRoot(config)}/${docPath}`;

  requiredAttributes.forEach(attribute => {
    if (!userGivenAttributes.hasOwnProperty(attribute)) {
      console.log(`Required attribute '${attribute}' is missing.\nFile path: '${docFullPath}'\nTag: '${tag.trim()}'`)
      process.exit(1);
    }
  });

  Object.keys(userGivenAttributes).forEach(attribute => {
    if (userGivenAttributes[attribute] === 'undefined') {
      console.log(`Found value 'undefined' for attribute '${attribute}'.\nFile path: '${docFullPath}'\nTag: '${tag.trim()}'`);
      process.exit(1);
    }
  });
}

module.exports = function (body, config, docPath) {
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
        attrs = getAttrs(openTag, docPath, config);

        if (config.org === attrs.org) return `${indent}${content}`;
        return '';
      }
    )
    .replace(
      /(\s*)(<file[^>]*>)(.*?)<\/file>/gms,
      function (_, indent, openTag, content) {
        attrs = getAttrs(openTag, docPath, config);

        const updatedContent = `<a href="${attrs.href}" target="_blank" rel="noreferrer">${content}</a>`;
        return `${indent}${updatedContent}`;
      }
    )
    .replace(/(\s*)<img([^>]*)\/?>/gm, function (openTag, indent) {
      attrs = getAttrs(openTag, docPath, config);

      if (attrs.src) {
        const isInternalImage = attrs.src.startsWith('/docs/');
        if (isInternalImage) {
          attrs.src = attrs.src.replace(/^\/docs\//, config.publicPath);
        }
      }
      attrs.class = attrs.class ? attrs.class : 'click-zoom'; // overriding class for now
      const updatedAttrs = Object.keys(attrs)
        .map((k) => ` ${k}="${attrs[k]}"`)
        .join(' ');
      return `\n${indent}<img${updatedAttrs}>\n`;
    })
    .replace(
      /(\s*)(<a([^>]*?)>)(.*?)<\/a>/gm,
      function (_, indent, openTag, __, content) {
        attrs = getAttrs(openTag, docPath, config);

        if (attrs.href) {
          attrs.href = customLink(attrs.href, config);
        }
        const updatedAttrs = Object.keys(attrs)
          .map((k) => ` ${k}="${attrs[k]}"`)
          .join(' ');
        return `${indent}<a${updatedAttrs}>${content}</a>`;
      }
    );
};
