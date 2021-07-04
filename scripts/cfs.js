const fs = require('fs').promises;
const { readFileSync } = require('fs');
const path = require('path');

const getIndexPath = (filePath) =>
  filePath.substring(0, filePath.length - 3) + '/index.md';

function CachedFS() {
  const cache = {};
  const dirs = {};
  return {
    forget(path) {
      delete cache[path];
    },
    read(filepath) {
      if (!cache.hasOwnProperty(filepath)) {
        cache[filepath] = new Promise((resolve) => {
          fs.readFile(filepath)
            .then((data) => resolve(String(data)))
            .catch((e) => {
              const indexFilePath = getIndexPath(filepath);
              fs.readFile(indexFilePath)
                .then((data) => resolve(String(data)))
                .catch(() => {
                  console.warn('File not found', filepath);
                  resolve();
                });
            });
        });
      }
      return cache[filepath];
    },
    readSync(filepath) {
      if (!cache.hasOwnProperty(filepath)) {
        let content;
        try {
          content = readFileSync(filepath);
        } catch (error) {
          const indexFilePath = getIndexPath(filepath);
          try {
            content = readFileSync(indexFilePath);
          } catch (error) {
            console.warn('File not found', filepath);
          }
        }
        cache[filepath] = String(content);
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
