const hljs = require('highlight.js');
const markdownIt = require('markdown-it');
const deflist = require('markdown-it-deflist');
const anchor = require('markdown-it-anchor');
const sanitizeHtml = require('sanitize-html');
const customHtml = require('./html_block');
const customFence = require('./fence');
const customLink = require('./custom-link');

hljs.registerLanguage('curl', require('highlight.js/lib/languages/bash'));

let openTags, anchors;
const tokenFn = (state) => (type, tag, nesting, opts) => {
  const token = new state.Token(type, tag, nesting);
  if (opts) return Object.assign(token, opts);
  return token;
};

/**
 * Anchor tags in the following array will be wrapped with an article or section tag and will have a permalink associated with it.
 */
const anchorTags = ['h1', 'h2', 'h3', 'h4'];

/**
 * Render Permalink function takes opening heading tags and wraps the entire heading and content in wrapper tags.
 * For h1 tags, an article tag is used as a wrapper whereas, for all other tags specified in anchorTags, a section tag is used as wrapper.
 * There wrapper tags are opened on encountering a opening heading tag and are closed when the next heading tag is encountered.
 * Rules for opening and closing these tags are defined in the function.
 * This function doesn't receive any of the content tags and just deals with the heading tags. As a result, the content tags are automatically placed inside the wrapper tag.
 */

const renderPermalink = (slug, opts, state, idx) => {
  const href = opts.permalinkHref(slug, state);
  const token = tokenFn(state);
  const linkTokens = [
    token('link_open', 'a', 1, {
      attrs: [
        ['class', 'header-link'],
        ['href', href],
        ['name', href.slice(1)],
      ],
    }),
    ...state.tokens[idx + 1].children,
    token('html_inline', '', 0, {
      content: `<span class='header-anchor'>${opts.permalinkSymbol}</span>`,
    }),
    token('link_close', 'a', -1),
  ];
  const tag = state.tokens[idx].tag;
  if (anchorTags.includes(tag)) {
    // Add to anchors arrary for rendering table of contents
    anchors.push({
      href,
      level: tag.slice(1),
      title: state.tokens[idx + 1].children
        .filter(
          (tokenAtIndex) => tokenAtIndex.type === 'text' || tokenAtIndex.type === 'code_inline',
        )
        .reduce((acc, t) => acc + t.content, ''),
    });

    // Wrapper html tag for different heading elements
    const wrapper = tag === 'h1' ? 'article' : 'section';

    if (openTags.length) {
      /**
       * There are open tags, let's close those first
       * Assumptions:
       * 1. h1 tags have an article tag as a wrapper that can have h2, h3, h4 and other contetn tags as it's children.
       *    This means that on encountering a h1 tag, we need to close all other wrappers and start a new article tag.
       * 2. h2, h3 and h4 tags have section as their wrapper and content tags as their children.
       *    This means that on encountering any of these tags, only the preceding section tag needs to be closed and a new section tag needs to be opened.
       *
       * Example:
       * Markdown:
       * # H1
       * Some content
       * ## H2
       * Some more content
       * ### H3
       * Some more content
       * # H1
       * Another content
       *
       * Result:
       * <article>
       *  <h1>...</h1>
       *  <p>Some Content</p>
       *  <section>
       *    <h2>...</h2>
       *    <p>Some more content</p>
       *  </section>
       *  <section>
       *    <h3>...</h3>
       *    <p>Some more content</p>
       *  </section>
       * </article>
       * <article>
       *  <h1>...</h1>
       *  <p>Another content</p>
       * </article>
       */
      if (tag === 'h1') {
        // Close all open tags as each h1 should be in items own article tag.
        // Reduce right is being used here as the opening tags is a stack and needs to be LIFO and because forEachRight is not available in JS
        openTags.reduceRight((_, openTag) => {
          state.tokens.splice(idx++, 0, token('html_inline', '', 0, { content: `</${openTag}>` }));
          return _;
        }, {});
        openTags = []; // resetting openTags as all open tags have been closed.
      } else {
        // Close the top most item from the stack if it is not an article tag
        const closingTag = openTags[openTags.length - 1];
        if (closingTag !== 'article') {
          // artcile should only be closed when tag is h1
          openTags.pop(); // Remove tag from list and add to html
          state.tokens.splice(
            idx++,
            0,
            token('html_inline', '', 0, { content: `</${closingTag}>` }),
          );
        }
      }
    }

    // Add wrapper to openTags array for closing them on encountering another heading.
    openTags.push(wrapper);
    // Add new opening tag for the heading
    state.tokens.splice(idx, 0, token('html_inline', '', 0, { content: `<${wrapper}>` }));
  }
  state.tokens[idx + 2].children = linkTokens;
};

function getMd(config) {
  const listOfSlugs = {}; // Fresh object for each page
  const md = markdownIt({
    html: true,
    langPrefix: 'lang lang-',
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, str).value;
        } catch (e) {}
      }
      return str;
    },
  })
    .disable(['table', 'lheading', 'hr', 'html_block'])
    .use(deflist)
    .use(anchor, {
      permalink: true,
      permalinkSymbol: '🔗',
      slugify: createSlug(listOfSlugs),
      renderPermalink,
    });

  md.block.ruler.before('heading', 'custom_html_block', customHtml(md));
  md.block.ruler.at('fence', customFence(md));
  const normalizeLink = md.normalizeLink;
  md.normalizeLink = (url) => {
    const customUrl = customLink(url, config);
    return normalizeLink(customUrl);
  };
  return md;
}

module.exports = (config) => {
  const md = getMd(config);
  return (content) => {
    openTags = [];
    anchors = [];
    content = md.render(content);
    /**
     * There will be openTags remaining for the last heading encountered while parsing the content.
     * This tag needs to be closed for the html to be valid.
     * Reduce right is being used here as the opening tags is a stack and needs to be LIFO
     */
    openTags.reduceRight((_, openTag) => {
      content += `</${openTag}>`;
      return _;
    }, {});

    

    /**
     * sanitizeHtml function is used here to clean up the html generated with unclosed / wrongly closed tags
     */
    content = sanitizeHtml(content, {
      allowedTags: false, // Do not filter out any tag from the html content
      allowedAttributes: false, // Do not filter out any attribute from the html
      allowedClasses: {
        '*': ['*'], // allow any class on all element
      },
      allowedStyles: {
        '*': '*', // allow any style tag on html elements
      },
      // TODO: Reduce this nesting to an acceptable value
      nestingLimit: 100, // allow any level of nesting
    });

    return {
      content,
      anchors,
    };
  };
};

/**
 * Generate unique slug for each heading on the page
 * @param {Object} listOfSlugs map of all slugs
 * @returns {Function} function to generate unique slug
 */
function createSlug(listOfSlugs) {
  return function getSlug(slug) {
    const normalizedSlug = slug
      .toLowerCase()
      .split(/\s+/g, 8)
      .join('-')
      .replace(/[^-\w]/g, '');
    if (listOfSlugs[normalizedSlug]) {
      const updatedCountForSameSlug = listOfSlugs[normalizedSlug] + 1;
      listOfSlugs[normalizedSlug] = updatedCountForSameSlug;
      return `${normalizedSlug}-${updatedCountForSameSlug}`;
    }
    listOfSlugs[normalizedSlug] = 1;
    return normalizedSlug;
  };
}
