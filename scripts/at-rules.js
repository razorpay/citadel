const fs = require('fs');
const path = require('path');
const readFileSync = (file) => fs.readFileSync(file, 'utf8');
const noop = () => {};
const cfs = require('./cfs');

// block rules are always functions
// called with `md` as context
const blockRules = {
  // use it to comment in markdown
  '//': (a) => '',

  image: function(rest, config) {
    return `<img src="/${config.publicPath}/assets/images/${rest[0]}"/>`;
  },

  // include another markdown
  include: function(rest, config) {
    /* Sample use in *.md files */
    // e.g. @include part1
    return cfs.readSync(`${config.partials}/${rest[0]}.md`);
  },
};

module.exports = function(body, config) {
  return body.replace(/^(\s*)@(\/\/|image|include)(.*)$/mg, function(
    _,
    indent,
    rule,
    rest,
  ) {
    rest = rest.split(/\s+/).filter(_ => _);
    return blockRules[rule](rest, config);
  })
};
