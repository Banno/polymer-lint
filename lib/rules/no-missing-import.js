/** @file Rule: no-missing-imports */
const componentNameFromPath = require('../util/componentNameFromPath');

/**
 * Checks if each custom element referenced in a template has a
 * matching import.
 *
 * @function no-missing-import
 * @memberof module:lib/rules
 * @param {Linter.LintStreamContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {void}
 */
module.exports = function noMissingImport(context, parser, onError) {
  const imports = {};

  parser.on('importTag', href => {
    const name = componentNameFromPath(href);
    imports[name] = true;
  });

  parser.on('customElementStartTag', (name, attrs, selfClosing, location) => {
    if (imports[name]) {
      return;
    }
    onError({
      message: `Custom element <${name}> used but not imported`,
      location,
    });
  });
};
