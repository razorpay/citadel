const unified = require("unified");
const toHtml = require("hast-util-to-html");
const rehype = require("rehype-parse");

module.exports = node => {
  const value = toHtml({ type: "root", children: node.children }).replace(
    /(:[^\/]+)/gm,
    "<b>$1</b>"
  );

  node.children = unified()
    .use(rehype, { fragment: true })
    .parse(value).children;
};
