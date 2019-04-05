module.exports = node => {
  const children = [];
  let defOpen = false;
  node.children.forEach(c => {
    if (defOpen) {
      if (c.type === "element" && c.tagName === "hr") {
        defOpen = false;
      } else {
        children[children.length - 1].children.push(c);
      }
    } else if (c.type === "element" && c.tagName === "p") {
      defOpen = true;
      c.tagName = "dt";
      children.push(c, {
        type: "element",
        tagName: "dd",
        children: []
      });
    }
  });
  node.children = children;
};
