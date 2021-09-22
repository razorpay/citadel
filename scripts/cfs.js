const fs = require('fs').promises;
const { readFileSync: readSync } = require('fs');
const path = require('path');

const getIndexPath = (filePath) => {
  const fileExtension = path.extname(filePath);
  const fileName = path.basename(filePath, fileExtension);
  if (fileExtension === '.md' && fileName !== 'index') {
    return path.dirname(filePath) + `/${fileName}/index.md`;
  }
  return '';
};

async function readFile(filePath) {
  let content;
  try {
    content = await fs.readFile(filePath);
  } catch (error) {
    const indexFilePath = getIndexPath(filePath);
    try {
      if (indexFilePath === '') {
        throw error;
      }
      content = await fs.readFile(indexFilePath);
    } catch (error) {
      return;
    }
  }
  return String(content);
}

function readFileSync(filePath) {
  let content;
  try {
    content = readSync(filePath);
  } catch (error) {
    const indexFilePath = getIndexPath(filePath);
    try {
      if (indexFilePath === '') {
        throw error;
      }
      content = readSync(indexFilePath);
    } catch (error) {
      return;
    }
  }
  return String(content);
}

function CachedFS() {
  const cache = {};
  const dirs = {};
  return {
    forget(path) {
      delete cache[path];
    },
    async read(filepath) {
      if (!cache.hasOwnProperty(filepath)) {
        cache[filepath] = await readFile(filepath);
      }
      return cache[filepath];
    },
    readSync(filepath) {
      if (!cache.hasOwnProperty(filepath)) {
        cache[filepath] = readFileSync(filepath);
      }
      return cache[filepath];
    },
    write(filepath, data) {
      const dir = path.dirname(filepath);
      return this.mkdir(dir).then(() => fs.writeFile(filepath, data));
    },
    mkdir(name) {
      if (!dirs.hasOwnProperty(name)) {
        const promise = new Promise((resolve, reject) => {
          fs.mkdir(name, { recursive: true }).then(resolve).catch(reject);
        });
        const split = name.split('/');
        split.forEach((a, i) => {
          dirs[split.slice(0, i + 1).join('/')] = promise;
        });
      }
      return dirs[name];
    },
  };
}

module.exports = CachedFS();
