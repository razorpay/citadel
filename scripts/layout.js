var through = require('through');
var pug = require('pug');
var linkUrl = require('./util').linkUrl;

module.exports = (layout) => {
  return through(function (file) {
    file.content = String(file.contents);
    file.linkUrl = linkUrl;
    var baseLayout = layout;
    if (file.frontMatter.layout) {
      baseLayout = layout.replace(/[^\/]+(?=\.pug)/, file.frontMatter.layout);
    }
    pug.renderFile(baseLayout, file, (err, html) => {
      if (err) {
        return this.emit('error', err);
      }
      file.contents = new Buffer(html);
      file.path = file.path.replace(/(\/index)?\.\w+$/, '/index.html');
      this.emit('data', file);
    });
  });
};
