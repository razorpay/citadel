const path = require('path');
const polka = require('polka');
const sirv = require('sirv');
const pug = require('pug');
const chokidar = require('chokidar').watch([]);
const { execSync } = require('child_process');
const createRedirects = require('./create-redirects');
const generateCss = require('./generate-css');
const generateJs = require('./generate-js');

const cfs = require('./scripts/cfs');
const atRules = require('./scripts/at-rules');
const getMarkdown = require('./scripts/md');

const { initializePlugin, applyPlugin, cleanupPlugin } = require('./plugins');

function init({ allDocs, config, watch, getKey }) {
  config.plugins.forEach((plugin) => initializePlugin(plugin, config));

  if (watch) {
    chokidar.add([config.src, config.partials]).on('all', (event, filepath) => {
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
    ${
      watch
        ? `ln -s ${path.relative(config.dist, config.assets)} ${
            config.dist
          }/assets`
        : `cp -r ${config.assets} ${config.dist}`
    };
  `);
  generateCss({ config });
  generateJs({ config });
  return {
    pugCompiler: pug.compileFile(config.layout),
  };
}

function getNav(doc, allDocs, config) {
  const indexDoc = allDocs[doc.index];
  const nav = [];
  const last = {};
  indexDoc.tree.forEach((d) => {
    let { level, key } = d;
    if (key) {
      if (!checkAllowed(key, config)) return;
      if (!allDocs[key] && allDocs[key + '/index']) key = key + '/index';
    }
    const title = d.title || allDocs[key]?.frontMatter.title || '';

    const item = {
      key,
      title,
      href: key && allDocs[key]?.href,
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

function compileDoc({ doc, config, pugCompiler, allDocs, markdown }) {
  let content = atRules(doc.body, config);
  const parsedContent = markdown(content, config);
  const parsedContentWithFrontmatter = {
    ...parsedContent,
    ...doc.frontMatter,
    body: content,
    href: doc.href,
  };
  const result = config.plugins.reduce(function (acc, plugin) {
    return applyPlugin({ plugin, content: acc });
  }, parsedContentWithFrontmatter);
  return pugCompiler({
    ...doc,
    ...result,
    nav: getNav(doc, allDocs, config),
    config,
  });
}

const serve = ({ config, getDoc, getPath, allDocs, getKey }) => {
  const markdown = getMarkdown(config);
  const { pugCompiler } = init({ allDocs, config, watch: true, getKey });
  const serveDoc = async (req, res, next) => {
    let key = req.path.slice(1).replace(/\/$/, '');
    if (!checkAllowed(key, config)) return next();
    let result = await cfs.read(getPath(key));
    if (!result) {
      key += '/index';
      result = await cfs.read(getPath(key));
    }
    if (!result) return next();
    const doc = await getDoc(key);
    await Promise.all(
      allDocs[doc.index].tree.map(async (d) => {
        let navKey = d.key;
        let result = await cfs.read(getPath(navKey));
        if (!result) {
          navKey += '/index';
          result = await cfs.read(getPath(navKey));
        }
        if (result) {
          await getDoc(navKey);
        }
      })
    );
    res.end(compileDoc({ doc, config, pugCompiler, allDocs, markdown }));
    config.plugins.forEach(cleanupPlugin);
  };

  polka()
    .use(
      config.publicPath.replace(/\/$/, ''),
      serveDoc,
      sirv(config.dist, { dev: true }),
      sirv(config.src, { dev: true })
    )
    .listen(config.port, (err) => {
      if (err) throw err;
      console.log(`> Running ${config.org} on http://localhost:${config.port}`);
    });
  createRedirects(config);
};

async function build({ config, getDoc, docs, getKey, allDocs }) {
  const markdown = getMarkdown(config);
  docs = await Promise.all(
    docs
      .map((d) => {
        const key = getKey(d);
        return checkAllowed(key, config) && getDoc(key);
      })
      .filter((_) => _)
  );
  const { pugCompiler } = init({ config });
  execSync(
    `cp -r ${config.src}/* ${config.dist}/; find ${config.dist} -name  "*.md" -type f -delete`
  );
  docs.forEach((doc) => {
    const html = compileDoc({ doc, config, pugCompiler, allDocs, markdown });
    const filepath = config.dist + '/' + doc.href + '/index.html';
    cfs.write(filepath, html);
  });
  createRedirects(config);
  config.plugins.forEach(cleanupPlugin);
}

function checkAllowed(key, config) {
  let allow = true;
  config.rules.forEach((rule) => {
    if (key.startsWith(rule.slice(1))) {
      allow = rule[0] === '+';
    }
  });
  return allow;
}

module.exports = {
  serve,
  build,
};
