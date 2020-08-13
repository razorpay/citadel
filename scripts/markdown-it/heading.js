const slugify = function (title) {
  return title
    .toLowerCase()
    .split(/\s+/g, 8)
    .join('-')
    .replace(/[^-\w]/g, '');
};

// heading (#, ##, ...)

('use strict');

function isSpace(code) {
  switch (code) {
    case 0x09:
    case 0x20:
      return true;
  }
  return false;
}

module.exports = function (md) {
  return function heading(state, startLine, endLine, silent) {
    var ch,
      level,
      tmp,
      token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) {
      return false;
    }

    ch = state.src.charCodeAt(pos);

    if (ch !== 0x23 /* # */ || pos >= max) {
      return false;
    }

    // count heading level
    level = 1;
    ch = state.src.charCodeAt(++pos);
    while (ch === 0x23 /* # */ && pos < max && level <= 6) {
      level++;
      ch = state.src.charCodeAt(++pos);
    }

    if (level > 6 || (pos < max && !(ch === 0x21 || isSpace(ch)))) {
      return false;
    }

    if (silent) {
      return true;
    }

    // Let's cut tails like '    ###  ' from the end of string

    max = state.skipSpacesBack(max, pos);
    tmp = state.skipCharsBack(max, 0x23, pos); // #

    if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
      max = tmp;
    }

    state.line = startLine + 1;

    const markup = '######'.slice(0, level);

    const title = state.src.slice(pos + 1, max).trim();
    var slug = slugify(title);

    var { currentFile } = md;

    while (currentFile.slugs[slug]) {
      slug = slug + '_';
    }
    currentFile.slugs[slug] = 1;

    var preContent = '';
    if (currentFile) {
      if (level === 1) {
        md.openTag('article', state);
      } else if (level === 2) {
        md.openTag('section', state);
      }
      if (ch !== 0x21) {
        let node = currentFile.node;
        currentFile.anchors.push({
          parent: node,
          hash: slug,
          exists: true,
          level: ((node && node.level) || 0) + level,
          title,
          children: [],
          url: currentFile.fileUrl + '/#' + slug,
        });
      }
    }

    level = String(level);

    token = state.push('heading_open', 'h' + level, 1);
    token.markup = markup;
    token.map = [startLine, state.line];

    token = state.push('inline', '', 0);
    token.content = `<a class="header-link" href="#${slug}" name="${slug}">${title}<span class="header-anchor">#</span></a>`;
    token.map = [startLine, state.line];
    token.children = [];

    token = state.push('heading_close', 'h' + level, -1);
    token.markup = markup;

    return true;
  };
};
