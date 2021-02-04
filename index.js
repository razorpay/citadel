'use strict';
const glob = require('glob').sync;
const frontMatter = require('front-matter');
const argv = require('yargs-parser')(process.argv.slice(2));
const cfs = require('./scripts/cfs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const isServer = argv._.indexOf('serve') !== -1;
const { serve, build } = require('./server');

const markdownExtension = '.md';
const indexDocument = 'index' + markdownExtension;
const consumerRoot = process.env.PWD;
const getDocumentsRoot = config => path.resolve(config.src);
const getDocumentsGlob = config => `${getDocumentsRoot(config)}/**/*${markdownExtension}`;

function readConfig() {
  return require(path.resolve(argv.c || 'config.js'));
}

const dir = str => str.replace(/\/[^/]+$/, '');

async function compile(config) {
  const documentsRoot = getDocumentsRoot(config);
  const getKey = path => path.slice(documentsRoot.length + 1, - markdownExtension.length)
  const getPath = key => documentsRoot + '/' + key + markdownExtension;
  const allDocs = {};

  async function getDoc(key) {
    if (allDocs.hasOwnProperty(key)) return allDocs[key];

    let contents;
    try {
      contents = await cfs.read(getPath(key));
    } catch(e) {
      console.error(`Doc not found: ${key}`);
      return;
    }
    const { attributes, body } = frontMatter(contents);
    const href = key.replace(/(^|\/)index$/, '');
    const doc = {
      key,
      frontMatter: attributes,
      body,
      href,
      tree: (attributes.tree || '').split('\n').filter(_ => _).map(line => {
        const split = line.split('|');
        const level = split[0].match(/^\s+/)?.[0].length / 2 || 0;
        const title = split.length > 1 && split.slice(1).join('|').trim();
        const navKey = split[0].trim();
        const treeKey = navKey ? (dir(href) + '/' + navKey).replace(/^\//, '') : '';
        return {
          key: treeKey,
          title,
          level,
        }
      }),
    };
    allDocs[key] = doc;
    doc.index = await getIndex(doc);
    if (doc.index !== key) {
      const indexDoc = allDocs[doc.index];
      doc.frontMatter = { ...indexDoc.frontMatter, ...attributes };
    }
    return doc;
  }

  async function getIndex(doc) {
    if (doc.frontMatter.tree) {
      return doc.key;
    }
    const split = doc.key.split('/');
    for (let i = split.length - 1; i >= 0; i--) {
      const maybeKey = split.slice(0, i).concat('index').join('/');
      if (maybeKey === doc.key) continue;
      const file = await cfs.read(getPath(maybeKey));
      if (file) {
        const maybeDoc = await getDoc(maybeKey);
        if (maybeDoc.tree.find(t => t.key === doc.key || t.key === doc.href)) {
          return maybeKey;
        }
      } else {
        continue;
      }
    }
    return doc.key;
  }

  if (isServer) {
    serve({
      config,
      getDoc,
      getPath,
      getKey,
      allDocs,
    });
  } else {
    build({
      config,
      getDoc,
      docs: glob(getDocumentsGlob(config)),
      getKey,
      allDocs,
    });
  }
}

readConfig().forEach(compile);