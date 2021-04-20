const fs = require('fs').promises;
const path = require('path');
const stylus = require('stylus');

async function generateCss({ config }) {
  const css = await fs.readFile(config.css);
  stylus.render(
    String(css),
    { filename: config.css, 'include css': true },
    function (err, css) {
      if (err) throw err;
      fs.writeFile(
        config.dist + '/' + path.basename(config.css, '.styl') + '.css',
        css
      );
    }
  );
}

module.exports = generateCss;
