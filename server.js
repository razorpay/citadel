const fs = require('fs').promises;
const path = require('path');
const polka = require('polka');
const sirv = require('sirv');
const pug = require('pug');
const chokidar = require('chokidar').watch([]);
const webpack = require('webpack');
const stylus = require('stylus');
const webpackConfigBase = require('./webpack.config');
const { spawn, execSync } = require('child_process');

const cfs = require('./scripts/cfs');
const atRules = require('./scripts/at-rules');
const customHtml = require('./scripts/custom-html');
const markdown = require('./scripts/md');

function init({ allDocs, config, watch, getKey }) {
  if (watch) {
    chokidar.add([config.src, config.partials])
      .on('all', (event, filepath) => {
        switch (event) {
          case 'change':
            filepath = path.resolve(filepath);
            delete allDocs[getKey(filepath)];
            cfs.forget(filepath);
            break;
        }
      });
  }
  execSync(`
    rm -rf ${config.dist};
    mkdir -p ${config.dist};
    ${watch ? `ln -s ${path.relative(config.dist, config.assets)} ${config.dist}/assets` : `cp -r ${config.assets} ${config.dist}`};
  `);
  generateCss({ config });
  generateJs({ config });
  return {
    pugCompiler: pug.compileFile(config.layout),
  }
}

const serve = ({ config, getDoc, getPath, allDocs, getKey }) => {
  const { pugCompiler } = init({ allDocs, config, watch: true, getKey });
  const serveDoc = async (req, res, next) => {
    let key = req.path.slice(1).replace(/\/$/, '');
    if (!checkAllowed(key, config)) return next();
    let result = await cfs.read(getPath(key));
    if (!result) {
      key = [key, 'index'].filter(_ => _).join('/')
      result = await cfs.read(getPath(key));
    }
    if (!result) return next();
    const doc = await getDoc(key);
    await Promise.all(allDocs[doc.index].tree.map(async d => {
      let navKey = d.key;
      let result = await cfs.read(getPath(navKey));
      if (!result) {
        navKey += '/index';
        result = await cfs.read(getPath(navKey));
      }
      if (result) {
        await getDoc(navKey);
      }
    }));
    res.end(compileDoc({ doc, config, pugCompiler, allDocs }));
  }

  polka()
    .use(
      config.publicPath.replace(/(?:.)\/$/, ''),
      serveDoc,
      sirv(config.dist, { dev: true })
    )
    .listen(config.port, err => {
      if (err) throw err;
      console.log(`> Running ${config.org} on http://localhost:${config.port}`);
    });
}

async function generateCss({ config }) {
  const css = await fs.readFile(config.css);
  stylus.render(String(css), { filename: config.css }, function(err, css){
    if (err) throw err;
    fs.writeFile(config.dist + '/' + path.basename(config.css, '.styl') + '.css', css);
  });
}

function generateJs({ config }) {
  const webpackConfig = {
    ...webpackConfigBase,
    entry: process.env.PWD + '/' + config.js,
    output: {
      path: path.resolve(config.dist),
    }
  }
  webpack(webpackConfig, (err, stats) => {
    if (err) {
      return console.error(err);
    }
    console.log(stats.toString({ colors: true }));
  });

}

function getNav(doc, allDocs, config) {
  const indexDoc = allDocs[doc.index];
  const nav = [];
  const last = {};
  indexDoc.tree.forEach(d => {
    let { level, key } = d;
    if (key) {
      if (!checkAllowed(key, config)) return;
      if (!allDocs[key] && allDocs[key + '/index']) key = key + '/index';
    }
    const title = d.title || allDocs[key].frontMatter.title;

    const item = {
      key,
      title,
      href: key && allDocs[key].href,
      level,
      children: [],
      active: key === doc.key,
    };

    last[level] = item;
    if (level) {
      last[level - 1].children.push(item);
      if (item.active) {
        for (let i = level - 1; i === 0; i--) {
          last[i].active = true;
        }
      }
    } else {
      nav.push(item);
    }
  });
  return nav;
}

function compileDoc({ doc, config, pugCompiler, allDocs }) {
  let content = atRules(doc.body, config);
  content = markdown(content, config);
  return pugCompiler({
    ...doc,
    nav: getNav(doc, allDocs, config),
    content,
    config,
  });
}

async function build({ config, getDoc, docs, getKey, allDocs }) {
  docs = await Promise.all(docs.map(d => {
    const key = getKey(d);
    return checkAllowed(key, config) && getDoc(key);
  }).filter(_ => _));
  const { pugCompiler } = init({ config });
  docs.forEach(doc => {
    const html = compileDoc({ doc, config, pugCompiler, allDocs });
    const filepath = config.dist + '/' + doc.href + '/index.html';
    cfs.write(filepath, html);
  });
}

function checkAllowed(key, config) {
  let allow = true;
  config.rules.forEach(rule => {
    if (key.startsWith(rule.slice(1))) {
      allow = rule[0] === '+';
    }
  });
  return allow;
}

module.exports = {
  serve,
  build,
}