const fs = require('fs');
const cfs = require('./cfs');
const htmlparser = require('htmlparser2');
const customLink = require('./custom-link');
const { getDocumentsRoot } = require('../fs-helpers');

// block rules are always functions
// called with `md` as context
const blockRules = {
  // use it to comment in markdown
  '//': (a) => '',

  image: function (rest, config) {
    return `<img src="${config.publicPath}assets/images/${rest[0]}"/>`;
  },

  // include another markdown
  include: function (rest, config) {
    /* Sample use in *.md files */
    // e.g. @include part1
    const content = cfs.readSync(`${config.partials}/${rest[0]}.md`);
    // adding a space as html elements require a black line before them.
    return `\n${content}`;
  },
};

const requiredAttributesByTags = {
  'a': ['href'],
  'file': ['href'],
  'show-if': ['org'],
  'img': ['src']
};

function getAttrs(openTag, docPath, config) {
  let attrs = {};
  let tagName;

  const parser = new htmlparser.Parser({
    onopentag(name, _attrs) {
      attrs = _attrs;
      tagName = name;
    },
  });
  parser.write(openTag);
  parser.end();
  validateAttributes(openTag, attrs, requiredAttributesByTags[tagName], docPath, config);
  return attrs;
}

function validateAttributes(tag = '', userGivenAttributes = {}, requiredAttributes = [], docPath, config) {
  // running it just for razorpay org
  // else validation will run for same files for other orgs as well
  if (config.org !== 'razorpay') return;

  const docFullPath = `${getDocumentsRoot(config)}/${docPath}`;

  requiredAttributes.forEach(attribute => {
    if (!userGivenAttributes.hasOwnProperty(attribute)) {
      console.log(`Required attribute '${attribute}' is missing.\nFile path: '${docFullPath}'\nTag: '${tag.trim()}'`)
      process.exit(1);
    }
  });

  Object.keys(userGivenAttributes).forEach(attribute => {
    if (userGivenAttributes[attribute] === 'undefined') {
      console.log(`Found value 'undefined' for attribute '${attribute}'.\nFile path: '${docFullPath}'\nTag: '${tag.trim()}'`);
      process.exit(1);
    }
  });
}

module.exports = function (body, config, docPath) {
  return body
    .replace(
      /^(\s*)@(\/\/|image|include)(.*)$/gm,
      function (_, indent, rule, rest) {
        rest = rest.split(/\s+/).filter((_) => _);
        return blockRules[rule](rest, config);
      }
    )
    .replace(
      /^(\s*)(<show-if[^>]*>)(.*?)<\/show-if>/gms,
      function (_, indent, openTag, content) {
        attrs = getAttrs(openTag, docPath, config);

        if (config.org === attrs.org) return `${indent}${content}`;
        return '';
      }
    )
    .replace(
      /(\s*)(<file[^>]*>)(.*?)<\/file>/gms,
      function (_, indent, openTag, content) {
        attrs = getAttrs(openTag, docPath, config);

        const updatedContent = `<a href="${attrs.href}" target="_blank" rel="noreferrer">${content}</a>`;
        return `${indent}${updatedContent}`;
      }
    )
    .replace(/(\s*)<img([^>]*)\/?>/gm, function (openTag, indent) {
      attrs = getAttrs(openTag, docPath, config);

      if (attrs.src) {
        const isInternalImage = attrs.src.startsWith('/docs/');
        if (isInternalImage) {
          attrs.src = attrs.src.replace(/^\/docs\//, config.publicPath);
        }
      }
      attrs.class = attrs.class ? attrs.class : 'click-zoom'; // overriding class for now
      const updatedAttrs = Object.keys(attrs)
        .map((k) => ` ${k}="${attrs[k]}"`)
        .join(' ');
      return `\n${indent}<img${updatedAttrs}>\n`;
    })
    .replace(
      /(\s*)(<a([^>]*?)>)(.*?)<\/a>/gm,
      function (_, indent, openTag, __, content) {
        attrs = getAttrs(openTag, docPath, config);

        if (attrs.href) {
          attrs.href = customLink(attrs.href, config);
        }
        const updatedAttrs = Object.keys(attrs)
          .map((k) => ` ${k}="${attrs[k]}"`)
          .join(' ');
        return `${indent}<a${updatedAttrs}>${content}</a>`;
      }
    )
    .replace(/(\s*)<checkout-demo([^>]*)\/?>/gm, function (openTag, indent) {
      const buttonTag = '<button id="rzp-button1">Pay with Razorpay</button>';
      const styleTag = '<style>#rzp-button1{border: 0; border-radius: 3px; -webkit-transition: .2s; transition: .2s; box-shadow: 0 3px 13px rgba(0,0,0,0.09), 0 1px 5px 0 rgba(0,0,0,0.14); -webkit-user-select: none; -ms-user-select: none; user-select: none; line-height: 48px; height: 40px; padding: 0 24px; font-size: 14px; text-transform: uppercase; letter-spacing: .5px; font-weight: bold; background: #528ff0; color: #fff; cursor: pointer; \}#rzp-button1:hover{-webkit-transform: translateY(-2px) scale(1.01); -ms-transform: translateY(-2px) scale(1.01); transform: translateY(-2px) scale(1.01); box-shadow: 0 5px 16px 1px rgba(0,0,0,0.13), 0 1px 4px 0 rgba(0,0,0,0.09); \}#rzp-button1:active{-webkit-transform: perspective(40px) rotateX(1deg); transform: perspective(40px) rotateX(1deg) \}#rzp-button1 p{margin: 0; padding: 0; line-height: 40px; font-size: 14px; \}</style>';
      const scriptTag = '<script src="https://checkout.razorpay.com/v1/checkout.js"></script> <script>var options={"key": "rzp_live_ILgsfZCZoFIKMb", "amount": "100", "name": "Acme Corp", "description": "Generic Game - Flash Sale Deal", "image": "https://cdn.razorpay.com/logos/7K3b6d18wHwKzL_medium.jpg", "handler": function (response){alert(response.razorpay_payment_id); \}, "prefill":{"name": "Gaurav Kumar", "email": "gaurav.kumar@example.com" \}, "notes":{"address": "note value" \}, "theme":{"color": "#6A59CE" \}}; var rzp1=new Razorpay(options); document.getElementById("rzp-button1").onclick=function(e){rzp1.open(); e.preventDefault();}</script>';
      const contentToUpdate = `${buttonTag}\n${styleTag}\n${scriptTag}\n`;
      
      return `\n${indent}${contentToUpdate}\n`;
    });
};
