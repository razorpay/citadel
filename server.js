const path = require('path');
const express = require('express');
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

function getNav(doc, allDocs, config, level1 = null) {
  const indexDoc = allDocs[doc.index];
  const nav = [];
  const last = {};
  indexDoc.tree.forEach((d) => {
    let { level, key } = d;
    if (key) {
      if (!checkAllowed(key, config)) return;
      if (!allDocs[key] && allDocs[key + '/index']) key = key + '/index';
    }
    const title = d.title || allDocs[key]?.frontMatter.title;

    let item = {
      key,
      title,
      href: key && allDocs[key]?.href,
      level,
      children: [],
      active: key === doc.key,
    };

    if(process.env.NODE_ENV && process.env.NODE_ENV === 'development' && level1){
      var commonPrefix = '';
      for (var i = 0; i < doc.key.length; i++) {
        if (doc.key[i] === key[i]) {
          commonPrefix += doc.key[i];
        } else {
          break;
        }
      }
      var url = level1+'/' + key.substring(commonPrefix.length)
      item = {...item , href: url.replace('/index', '').trim()}
    }

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

function compileDoc({ doc, config, pugCompiler, allDocs, markdown, level1 = null }) {
  let content = atRules(doc.body, config, doc.key);
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
    nav: getNav(doc, allDocs, config, level1),
    config,
  });
}

const serve = ({ config, getDoc, getPath, allDocs, getKey, filePathsDontExist }) => {
  console.log('serve execute')
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
    if (filePathsDontExist.length) {
      filePathsDontExist.forEach(obj => {
        console.error(`File not found at path \n${obj.filePath} \nPlease check if paths defined in 'tree' are correct at path \n${obj.treeFilePath}`)
      });
      process.exit(1);
    }
    let level1 = null;
    await Promise.all(
      allDocs[doc.index].tree.map(async (d) => {
        let navKey = d.key;
        let result = await cfs.read(getPath(navKey));
        if (!result) {
          navKey += '/index';
          if(process.env.NODE_ENV && process.env.NODE_ENV === 'development'){
            result = await cfs.read(getPath(doc.key));
            level1 = doc.key;
          }else{
            result = await cfs.read(getPath(navKey));
          }
        }
        if (result) {
          await getDoc(navKey);
        }
      })
    );
    res.end(compileDoc({ doc, config, pugCompiler, allDocs, markdown, level1 }));
    config.plugins.forEach(cleanupPlugin);
  };

  express()
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
};

async function build({ config, getDoc, docs, getKey, allDocs, filePathsDontExist }) {
  const markdown = getMarkdown(config);
  docs = await Promise.all(
    docs
      .map((d) => {
        const key = getKey(d);
        return checkAllowed(key, config) && getDoc(key);
      })
      .filter((_) => _)
  );
  
  if (filePathsDontExist.length) {
    filePathsDontExist.forEach(obj => {
      console.error(`File not found at path: \n${obj.filePath} \nPlease check if paths defined in 'tree' are correct at path: \n${obj.treeFilePath} \n`)
    });
    process.exit(1);
  }

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
