const unified = require("unified");
const visit = require("unist-util-visit");
const remark = require("remark-parse");
const remark2rehype = require("remark-rehype");
const raw = require("rehype-raw");
const stringify = require("rehype-stringify");

const highlight = require("remark-highlight.js");
const slug = require("remark-slug");
const headings = require("remark-autolink-headings");
const custom = require("./components");

const parser = (module.exports = md => {
  return unified()
    .use(remark)
    .use(slug)
    .use(headings)
    .use(highlight)
    .use(remark2rehype, { allowDangerousHTML: true })
    .use(raw)
    .use(options => (node, file) => {
      visit(node, "element", node => {
        const customFn = custom[node.tagName];
        customFn && customFn(node, parser);
      });
      visit(node, "comment", node => {
        node.value = "";
      });
    })
    .use(stringify)
    .processSync(md).contents;
});
