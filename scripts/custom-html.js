const htmlparser2 = require('htmlparser2');

// table row delimiterc
const row_delim = '---';

function attrs(map) {
  return Object.entries(map).map(([k, v]) => ` ${k}="${v}"`).join('');
}


// tags with custom content rendering
const customHtml = {
  table: (html, attributes, config, md) => {
    const rows = html.split(/^---$/m);
    const hasHeader = !rows[0];
    let numRows;
    const result = '<table>' + rows.map((row, index) => {
      const td = !index && hasHeader ? 'th' : 'td';
      let rowContent = row.split(/[|\n]/).map(a => a.trim()).filter(_ => _);
      if (!numRows) {
        numRows = rowContent.length;
      } else {
        rowContent = [
          ...rowContent.slice(0, numRows - 1),
          rowContent.slice(numRows - 1).join('\n'),
        ];
      }
      rowContent = rowContent.map(a => {
        return `<${td}>${md.render(a.trim())}</${td}>`
      }).join('');
      return rowContent && `<tr>${rowContent}</tr>`;
    }).filter(_=>_).join('') + '</table>';
    return result;
  },

  url: function(html, attributes) {
    return `<url${attrs(attributes)}><div class="ib">${html.replace(/(:[^\/]+)/gm, '<b>$1</b>')}</div></url>`;
  },

  'show-if': function(html, attributes, config, md) {
    if (attributes.org === config.org) {
      return md.render(html);
    }
    return '';
  },

  callout: function(html, attributes, config, md) {
    return `<callout${attrs(attributes)}>${md.render(html.trim())}</callout>`;
  },

  aside: function(html, attributes, config, md) {
    return `<aside>${md.render(html.trim())}</aside>`;
  },

  img: function(html, attributes, config) {
    attributes.src = attributes.src.replace(/^\/docs\//, config.publicPath);
    attributes.class = attributes.class ? attributes.class : 'click-zoom';
    return `<img${attrs(attributes)}>`;
  }
};

function parseHtml(tokens, idx, config, md) {
  let tag;
  let attributes;
  let html = '';
  let customResult = false;
  let parsingDone = false;

  const parser = new htmlparser2.Parser({
    onopentag(name, _attributes) {
      if (!tag) {
        if (customHtml.hasOwnProperty(name)) {
          tag = name;
          attributes = _attributes;
        } else {
          parsingDone = true;
        }
      } else if (!(tag && name === 'br')) {
        if (name === 'img') {
          html += customHtml.img(null, _attributes, config);
        } else {
          html += `\n\n<${name}${attrs(_attributes)}>`;
        }
      }
    },
    ontext(text) {
      html += '\n\n' + text;
    },
    onclosetag(name) {
      if (name === tag) {
        customResult = true;
        parsingDone = true;
      } else if (!(tag && name === 'br')) {
        html += `</${name}>`;
      }
    },
  });

  let currentIndex = idx;
  while(!parsingDone && currentIndex < tokens.length) {
    parser.write(tokens[currentIndex].content);
    currentIndex++;
  }

  if (customResult) {
    tokens.slice(idx, currentIndex).forEach(token => {
      token.type = 'html_inline';
      token.content = '';
    });
    return customHtml[tag](html, attributes, config, md);
  } else {
    md.disable(['html_block']);
    const result = md.render(tokens[idx].content);
    md.enable(['html_block']);
    return result;
  }
};

module.exports = parseHtml;