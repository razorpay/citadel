const fs = require('fs').promises;
const { readFileSync } = require('fs');
const path = require('path');

function CachedFS() {
  const cache = {};
  const dirs = {};
  return {
    forget(path) {
      delete cache[path];
    },
    read(filepath) {
      if (!cache.hasOwnProperty(filepath)) {
        cache[filepath] = new Promise(resolve => {
          fs.readFile(filepath).then(data => resolve(String(data))).catch(e => resolve());
        });
      }
      return cache[filepath];
    },
    readSync(filepath) {
      if (!cache.hasOwnProperty(filepath)) {
        cache[filepath] = String(readFileSync(filepath));
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
    }
  }
}

module.exports = CachedFS();
