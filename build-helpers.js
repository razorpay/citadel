const {
  cfs,
  dir,
} = require('./fs-helpers');
const frontMatter = require('front-matter');

async function getFormattedDoc({ allDocs, getPath, filePathsDontExist }) {
  return async function getDoc(key) {
    if (allDocs.hasOwnProperty(key)) return allDocs[key];

    let contents;
    try {
      contents = await cfs.read(getPath(key));
    } catch (e) {
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
      tree: formatTree({ tree: attributes.tree || '', key, getPath, filePathsDontExist }),
    };
    allDocs[key] = doc;
    doc.index = await getIndex({ doc, getPath, getDoc });
    if (allDocs[doc.index].tree.length === 0) {
      doc.index = '/index';
    }
    if (doc.index !== key) {
      const indexDoc = allDocs[doc.index];
      doc.frontMatter = { ...indexDoc.frontMatter, ...attributes };
    }
    return doc;
  };
}

function formatTree({ tree, key, getPath, filePathsDontExist }) {
  return tree
    .split('\n')
    .filter((_) => _)
    .map((line) => {
      // 'folder-name | title' format is split here
      const split = line.split('|');
      const level = split[0].match(/^\s+/)?.[0].length / 2 || 0;
      const title = split.length > 1 && split.slice(1).join('|').trim();
      // 'folder-name' from the above split is stored in navKey
      // which will be used as a link to the page while generating navigation
      const navKey = split[0].trim();

      /** We are checking if paths given in the tree file exists or not
       *  we are pushing all the file paths that don't exist in an array
       *  and the build would fail at the end listing all these file paths
       */
      if (navKey && navKey !== 'index') {
        const filePath = key.replace(/(^|\/)index$/, '') + '/' + navKey;
        const content = cfs.readSync(getPath(filePath));

        if (
          !content &&
          !filePathsDontExist.find((obj) => obj.filePath === filePath)
        ) {
          filePathsDontExist.push({
            filePath,
            treeFilePath: key,
          });
        }
      }

      return {
        key: navKey && dir(key) + '/' + navKey,
        title,
        level,
      };
    });
}

async function getIndex({ doc, getPath, getDoc }) {
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
      if (maybeDoc.tree.find((t) => t.key === doc.key || t.key === doc.href)) {
        return maybeKey;
      }
    } else {
      continue;
    }
  }
  return doc.key;
}

module.exports = {
  getFormattedDoc,
};
