const unified = require('unified');
const markdown = require('remark-parse');
const html = require('parse5');
const fromParse5 = require('hast-util-from-parse5');
const frontMatter = require('front-matter');
const visit = require('unist-util-visit');

function addText(array, value) {
  array.push(value.replace(/\s+/g, ' ').trim());
}

function textualize(token) {
  let text = [];
  visit(token, (node) => {
    let value = node.value;
    if (value) {
      if (node.type === 'html') {
        visit(fromParse5(html.parseFragment(value)), (el) => {
          if (el.value) {
            addText(text, el.value);
          }
        });
      } else {
        addText(text, value);
      }
    }
  });
  return text.join(' ');
}

module.exports = {
  getDocuments: (file, body) => {
    const title = file.frontMatter.title || '';
    const url = file.fileUrl;

    const tokens = unified().use(markdown).parse(body).children;

    const headings = [];

    tokens.forEach((token) => {
      if (token.type === 'heading') {
        headings.push({
          title,
          url,
          head: textualize(token),
          body: [],
        });
      } else if (token.type !== 'html') {
        lastHeading = headings[headings.length - 1];
        if (lastHeading) {
          if (token.type === 'code') {
            lastHeading.type = 'code';
            lastHeading.body.push(token.value);
          } else {
            lastHeading.body.push(textualize(token));
          }
        }
      }
    });

    headings.forEach((h) => {
      h.body = h.body.join(' ');
    });

    return headings;
  },
};
