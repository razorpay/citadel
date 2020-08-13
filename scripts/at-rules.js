const fs = require('fs');
const path = require('path');
const readFileSync = (file) => fs.readFileSync(file, 'utf8');
const noop = () => {};
const yaml = require('js-yaml');
const { DOCS_DIR, DIST_DIR } = require('../config');

const inlineRules = yaml.load(readFileSync(`${DOCS_DIR}/data.yml`));

// block rules are always functions
// called with `md` as context
const blockRules = {
  // use it to comment in markdown
  '//': (a) => '',

  escapeHtml: function (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
      return htmlEntityMap[s];
    });
  },

  image: function (imagePath) {
    if (this.currentFile) {
      const imageFilePath = path.resolve(this.currentFile.dirname, imagePath);

      try {
        fs.accessSync(imageFilePath, fs.constants.F_OK);
        return `<img src="/${DIST_DIR}/${
          this.currentFile.fileUrl + '/' + imagePath
        }" />`;
      } catch (err) {
        // File not found in same directory
      }
    }

    return `<img src="/${DIST_DIR}/assets/images/${imagePath}"/>`;
  },

  // include another markdown
  include: function (filename) {
    /* Sample use in *.md files */
    // e.g. @include part1
    return readFileSync(`${DOCS_DIR}/partials/${filename}.md`);
  },
};

const htmlEntityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

module.exports = function (body, md) {
  return body
    .replace(/([^\w])@data((\.\w+)+)/g, function (_, preChr, rule) {
      if (preChr === '\\') {
        // escape at-rule, but remove slash
        return _.slice(1);
      }

      try {
        return (
          preChr +
          rule
            .slice(1)
            .split('.')
            .reduce((prev, next) => prev[next], inlineRules)
        );
      } catch (e) {
        return _;
      }
    })
    .replace(/^([ \t]*)(\\)?@(\w+|\/\/)(.*)$/gm, function (
      _,
      preChr = '',
      shouldEscape,
      rule,
      restLine
    ) {
      if (shouldEscape) {
        return _.slice(1);
      }
      var result;

      // only apply block rule if `@` is first character of line
      if (rule in blockRules) {
        // rest of the lines become block function arguments, space separated
        var restArgs = restLine.split(/\s+/).filter((a) => a);
        result = blockRules[rule].apply(md, restArgs);
        if (typeof result === 'string') {
          return preChr + result;
        }
      }
      return _;
    });
};
