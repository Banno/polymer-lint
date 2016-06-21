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

const componentNameFromPath = require('../util/componentNameFromPath');

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
    const name = componentNameFromPath(href);
    imports[name] = true;
  });

  parser.on('customElementStartTag', (name, attrs, selfClosing, location) => {
    if (imports[name]) { return; }
    onError({
      message: `Custom element <${name}> used but not imported`,
      location,
    });
  });
};
