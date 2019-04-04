/*
  Before ---
    Heading
    :   Description

  After ---
    <dl>
      <dt>Heading</dt>
      <dd>Description</dt>
    </dl>
*/

function defList(node) {
  if (!node.children || node.children.length !== 1) {
    return;
  }

  let text = node.children[0];
  if (text.type !== "text") {
    return;
  }

  text = text.value;
  if (/\n: /.test(text)) {
    console.log(text);
  }
}

module.exports = node => {
  console.log(node);
  defList(node);
  return;

  let tokens = html
      .replace(/(: [^\/]+)/gm, "<dd>$1</dd>")
      .replace(": ", "")
      .split("\n"),
    ddStartEle = tokens.filter(e => e.includes("<dd>"))[0],
    ddStartEleLocation = tokens.indexOf(ddStartEle),
    heading = tokens[ddStartEleLocation - 1].replace(" ", "");
  (description = ""), (beforeDefList = "");

  if (tokens[ddStartEleLocation - 2]) return;

  tokens.forEach((str, i) => {
    if (i < ddStartEleLocation - 1) {
      beforeDefList += str + "\n";
    } else if (i >= ddStartEleLocation) {
      description += str + "\n";
    }
  });

  if (!heading || !description) return;

  const value = `${beforeDefList}\n<dl>\n<dt>${heading.replace(
    " ",
    ""
  )}</dt>\n${description}</dl>\n`;

  node.type = "element";
  node.children[0].type = "html";
  node.children[0].value = value;
};
