const fs = require('fs');
const through = require('through');
const readFileSync = (file) => fs.readFileSync(file, 'utf8');
const frontMatter = require('front-matter');

const add = (map, filePath) => {
  var fm = frontMatter(readFileSync(filePath));
  var scope =
    fm.scope || filePath.replace(/^src\/routes\//, '').replace(/tree$/, '');
  var multistring = fm.body;

  // we'll determine the delimiter on first encounter
  // it'll be a fixed number of spaces
  let delimiterLen;

  // we'll keep a reference to previous object for generating next/prev links
  let prev;

  // split by newline character
  var order = multistring
    .split('\n')
    // filter out blank strings
    .filter((i) => i)

    /*
      convert to array of items, each having structure:
      {
        "url": "relative/path/from/base",
        "slug": "base", // ie itemname in tree.yml
        "level": 4, // how far from root level, which is 0
        "title": "base", // defaults to slug. later replaced with frontMatter property "title", if exists
        "parent": parent // one level higher node
      }

      we'll also add "exists", "prev" and "next" properties later
    */
    .map((slug, index) => {
      let level = 0;
      if (!delimiterLen) {
        delimiterLen = slug.replace(/\S.*/, '').length;
      }
      if (delimiterLen) {
        level = (slug.match(/^\s+/) || [''])[0].length / delimiterLen;
        slug = slug.replace(/^\s+/, '');
      }
      let slugSplit = slug.split('|');
      var slug = slugSplit[0].trim();

      var isIndex = false;
      if (slug === 'index') {
        slug = '';
        isIndex = true;
      }

      let cur = {
        slug,
        level,
        isIndex: isIndex,
        title: slugSplit[1] && slugSplit[1].trim(),
        treetributes: fm.attributes,
        children: [],
      };

      if (isIndex || slug) {
        cur.url = (scope + slug).replace(/^\/+|\/$/g, '');
      }
      if (prev) {
        // sets reference to node.parent
        setParent(cur, prev);
      }
      prev = cur;
      return cur;
    });

  order.forEach((node, index) => {
    map[node.url] = node;
    node.list = order.filter((n) => n.level === 0);
  });
};

function setParent(cur, prev) {
  // prev is a parent if level is more than cur
  if (cur.level > prev.level) {
    cur.parent = prev;
    prev.children.push(cur);

    // or if prev is sibling and has parent
  } else if (cur.level === prev.level) {
    if (prev.parent) {
      cur.parent = prev.parent;
      prev.parent.children.push(cur);
    }

    // or if prev is a nephew
  } else if (cur.level < prev.level) {
    let levelDiff = prev.level - cur.level;
    while (levelDiff) {
      levelDiff--;
      prev = prev.parent;
    }
    if (prev && prev.parent) {
      cur.parent = prev.parent;
      prev.parent.children.push(cur);
    }
  }
}

module.exports = (treeMap) => {
  let files = [];
  function onFile(file) {
    // add title if exists in tree
    let node =
      treeMap[file.relative.replace(/\.md$/, '').replace(/\/index$/, '')];
    if (node) {
      var list = node.list;

      // set title from frontmatter plugin
      if (!node.title) {
        if (file.frontMatter.title) {
          node.title = file.frontMatter.title;
        } else {
          node.title = node.slug;
        }
      }

      file.node = node;
    }
    files.push(file);
  }

  function onEnd() {
    files.forEach((file) => {
      var node = file.node;
      if (node) {
        var list = node.list;
        var nodeIndex = list.indexOf(node);
        var prevIndex = nodeIndex;
        while (prevIndex > 0) {
          let prev = list[--prevIndex];
          if (prev.url && prev.level) {
            node.prev = prev;
            break;
          }
        }

        var nextIndex = nodeIndex;
        while (nextIndex < list.length - 1) {
          let next = list[++nextIndex];
          if (next.url) {
            node.next = next;
            break;
          }
        }
      }
      this.emit('data', file);
    });
    this.emit('end');
  }

  return through(onFile, onEnd);
};

module.exports.add = add;
