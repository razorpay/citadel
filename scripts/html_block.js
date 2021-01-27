const htmlparser = require('htmlparser2');

module.exports = function (md, config) {
  md.renderer.rules.html_block = function (tokens, idx, options, env, self) {
    var token = tokens[idx];
    let { tag, lines, rawText } = token;

    if (rawText) {
      return rawText;
    } else if (raw_tags.indexOf(tag) !== -1) {
      return `${lines.join('\n')}</${tag}>`;
    } else if (lines.length <= 1) {
      return processSingleLine(lines[0], md, config);
    } else {
      var contentLines = lines.slice(1);

      if (contentLines.length) {
        let nextBlockIndent = contentLines[0].match(/^( +)/);
        if (nextBlockIndent) {
          nextBlockIndent = nextBlockIndent[0].length;
          contentLines = contentLines.map(l => l.slice(nextBlockIndent));
        }
      }

      var innerHTML = doprocess(tag, contentLines, md, config);
      var endTag = `</${tag}>`;
      if (tag === 'table') {
        return '<div style="overflow-y:auto">' + lines[0] + innerHTML + endTag + "</div>";
      }

      return lines[0] + innerHTML + endTag;
    }
  }

  return function (state, startLine, endLine, silent) {
    var i, nextLine, token, lineText,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

    // if it's indented more than 3 spaces, it should be a code block
    // if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    if (!state.md.options.html) { return false; }

    if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

    lineText = state.src.slice(pos, max);

    const HTML_OPEN = /^<(\w+).*>$/i;
    var tagMatch = HTML_OPEN.exec(lineText);
    if (!tagMatch) {
      return;
    }

    if (silent) {
      // true if this sequence can be a terminator, false otherwise
      return true;
    }

    let blockIndent = state.sCount[startLine];
    let lines = [lineText];

    token = state.push('html_block', '', 0);
    nextLine = startLine;

    if (!/\/\w*>$/i.test(lineText)) {


      // If we are here - we detected HTML block.
      // Let's roll down till block end.

      while (nextLine < endLine) {
        nextLine++;
        let sCount = state.sCount[nextLine];

        // indentation less than what we started with
        if (blockIndent > sCount) {
          break;
        }

        pos = state.bMarks[nextLine];
        max = state.eMarks[nextLine];
        lineText = state.src.slice(pos, max);

        if (lineText.startsWith('</' + tagMatch[1])) {
          break;
        }

        lines.push(lineText);
      }
    }

    state.line = nextLine + 1;

    token.map = [startLine, state.line];
    token.tag = tagMatch[1],
      token.lines = lines;

    return true;
  }
}

// table row delimiter
const row_delim = '---';

// tags with custom content rendering
const customHtml = {
  table: (lines, md) => {
    encountered_delim_row = false;
    return '<tr>' + lines.filter(l => l).reduce((prev, next) => {
      let delim_row = next.startsWith(row_delim);
      let td = encountered_delim_row ? 'td' : 'th';
      if (delim_row) {
        encountered_delim_row = true;
        if (prev) {
          prev += '</tr><tr>'
        }
      } else {
        prev += next.split('|').map(col => `<${td}>${md.render(col.trim())}</${td}>`).join('');
      }
      return prev;
    }, '') + '</tr>'
  },

  url: function (lines) {
    return '<div class="ib">' + lines.join('\n').replace(/(:[^\/]+)/gm, '<b>$1</b>') + '</div>';
  },
}


const raw_tags = ['script', 'style', 'pre', 'p', 'fence'];

function doprocess(tag, lines, md, config) {
  if (tag in customHtml) {
    return customHtml[tag](lines, md);
  }
  return md.render(lines.join('\n'));
}

function processSingleLine(line, md, config) {
  var html = '';
  var currenTag;
  var Parser = new htmlparser.Parser({
    onopentag: function (tag, attrs) {
      currenTag = tag;
      var openHtml = [tag];
      for (let i in attrs) {
        openHtml.push(`${i}=${attrs[i]}`)
      }
      html += `<${openHtml.join(' ')}>`;
    },

    ontext: function (text) {
      html += doprocess(currenTag, [text], md, config);
    },

    onclosetag: function (tag) {
      html += `</${tag}>`;
    }
  });
  Parser.write(line);
  Parser.end();
  return html;
}

