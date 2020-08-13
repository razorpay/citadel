// fences (```lang)
const escapeHtml = require('markdown-it/lib/common/utils').escapeHtml;

('use strict');

const FENCE = '```';

module.exports = function (md) {
  md.renderer.rules.fence = (tokens, idx) => tokens[idx].content;

  return function (state, startLine, endLine, silent) {
    var marker,
      len,
      params,
      nextLine,
      mem,
      token,
      markup,
      haveEndMarker = false,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

    // if it's indented more than 3 spaces, it should be a code block
    var sCountStart = state.sCount[startLine];
    if (sCountStart - state.blkIndent >= 4) {
      return false;
    }

    if (pos + 3 > max) {
      return false;
    }

    marker = state.src.charCodeAt(pos);

    // disable tilda based fence
    if (/*marker !== 0x7E && */ marker !== 0x60 /* ` */) {
      return false;
    }

    // scan marker length
    mem = pos;
    pos = state.skipChars(pos, marker);

    len = pos - mem;

    if (len !== 3) {
      return false;
    }

    markup = state.src.slice(mem, pos);
    params = state.src.slice(pos, max);

    if (params.indexOf(String.fromCharCode(marker)) >= 0) {
      return false;
    }

    // Since start is found, we can report success here in validation mode
    if (silent) {
      return true;
    }

    // search end of block
    nextLine = startLine;

    for (;;) {
      let lineText = state.src.slice(pos, max);
      nextLine++;
      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break;
      }

      pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max && state.sCount[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        // - ```
        //  test
        break;
      }

      if (state.src.charCodeAt(pos) !== marker) {
        continue;
      }

      if (state.sCount[nextLine] !== sCountStart) {
        // closing fence should be indented just as much as starting one
        continue;
      }

      pos = state.skipChars(pos, marker);

      // closing code fence must be 3 character long
      if (pos - mem !== len) {
        continue;
      }

      // make sure tail has spaces only
      pos = state.skipSpaces(pos);

      if (pos < max) {
        continue;
      }

      haveEndMarker = true;
      // found!
      break;
    }
    // If a fence has heading spaces, they should be removed from its inner block
    len = state.sCount[startLine];

    state.line = nextLine + (haveEndMarker ? 1 : 0);

    token = state.push('fence', 'pre', 0);
    token.content = makeFenceContent(
      state.getLines(startLine, nextLine, len, true)
    );
    token.markup = markup;
    token.map = [startLine, state.line];

    return true;
  };

  function makeFenceContent(content) {
    var cursor = 0;
    var lang, title;
    let radioCount = md.currentFile.radioCount++;
    let radioId = 0;

    var labelClass = 'code-labels';
    var labels = [];
    var copyOpen = false;

    var content =
      content
        .split(/^[`-]{3}/gm)
        .filter((code) => code.trim())
        .reduce((html, code, index) => {
          // firstLine
          let firstLine = code.split('\n', 1)[0];
          let codeAttrs = '';

          if (content[cursor] === '-') {
            if (copyOpen) {
              copyOpen = false;
            } else {
              copyOpen = true;
              codeAttrs = ' class="hl" tabIndex="1"';
            }
          } else {
            if (index) {
              // close previous code-container
              html += '</div>';
            }

            let info = firstLine.match(/(\w+)( )?:?(.*)$/);
            if (info) {
              lang = info[1];
              title = info[3];
            }
            if (info && info[2]) {
              // add languages if they do not exist
              if (
                md.currentFile.languages.findIndex(
                  (l) => l['lang'] === lang
                ) === -1
              ) {
                md.currentFile.languages.push({
                  lang,
                  title,
                });
              }
              labelClass += ' lang-labels';
            }

            let labelFor = `code-${radioCount}-${radioId++}`;

            // if language title given
            if (title) {
              html += `<input data-lang="${lang}" ${
                index ? '' : 'checked '
              } id="${labelFor}" name="radio-${radioCount}" type="radio">`;
              labels.push(`<label for="${labelFor}">${title}</label>`);
            }

            html += '<div class="code-container">';

            //Insert copy btn element only for lang pre code element
            html += '<span class="copy-btn">Copy</span>';
          }

          cursor += FENCE.length + code.length;
          code = code.slice(firstLine.length);

          let highlighted;
          if (md.options.highlight) {
            highlighted = md.options.highlight(code, lang);
          }
          code = highlighted || escapeHtml(code);

          return html + `<code${codeAttrs}>${code.replace(/^\n/, '')}</code>`;
        }, '') + '</div>';

    var preClass = 'codeblock';
    if (labels.length) {
      preClass += ' has-labels';
      labels = `<div class="${labelClass}">` + labels.join('') + '</div>';
    } else {
      labels = '';
    }

    return `<pre class="${preClass}">` + labels + content + '</pre>';
  }
};
