const unified = require("unified");
const rehype = require("rehype-parse");

let include;
if (typeof window === "undefined") {
  const readFileSync = require("fs").readFileSync;
  include = path => {
    const content = readFileSync(path);
    return unified()
      .use(rehype, { fragment: true })
      .parse(parser(content)).children;
  };
} else {
  include = path => {
    return [
      {
        type: "element",
        tagName: "div",
        properties: {
          class: "partial-placeholder",
          "data-path": path
        }
      }
    ];
  };
}

module.exports = (node, parser) => {
  const child = node.children[0];
  if (node.children.length === 1 && child.type === "text") {
    const [firstLine, ...description] = child.value.split("\n");

    if (firstLine[0] === "@") {
      // It is an at-rule
      const args = firstLine.slice(1).split(" ");
      const fn = rules[args[0]];
      if (fn) {
        fn(node, parser, args.slice(1), description.join("\n"));
      }
    }
  }
};

const rules = {
  image: function(node, parser, args, description) {
    if (description) {
      node.children.push({
        type: "element",
        tagName: "div",
        children: [
          {
            type: "text",
            value: description
          }
        ],
        properties: {
          class: "image-description"
        }
      });
    }
    node = node.children[0];
    node.type = "element";
    node.tagName = "img";
    node.properties = {
      src: `/docs/assets/images/${args.join(" ")}`,
      alt: description
    };
  },

  include: function(node, parser, args, description) {
    node.children = include(args.join(" ") + ".md");
  }
};
