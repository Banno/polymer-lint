/**
 * missing-imports
 *
 * Checks if each custom element referenced in a template has a
 * matching import.
 *
 * TODO: Allow exceptions
 *
 * @module lib/rules/missing-imports
 */

const path = require('path');

function nameFromHref(href) {
  return path.basename(href, '.html');
}

/*
 * @function missingImports
 * @param {RuleContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {}
 */
module.exports = function missingImports(context, parser, onError) {
  const imports = {};

  parser.on('importTag', (href) => {
    const name = nameFromHref(href);
    imports[name] = true;
  });

  parser.on('customElementStartTag', (name, attrs, selfClosing, location) => {
    if (imports[name]) { return; }
    onError(`Custom element <${name}> used but not imported`, location);
  });
};
