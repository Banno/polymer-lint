/**
 * no-unused-import
 *
 * Checks if all imported components are used.
 *
 * @module lib/rules/no-unused-import
 */

const componentNameFromPath = require('../util/componentNameFromPath');

/*
 * @function unused-import
 * @param {RuleContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {}
 */
module.exports = function noUnusedImport(context, parser, onError) {
  const imports = [];
  const usedImports = {};

  parser.on('importTag', (href, location) =>
    imports.push([ componentNameFromPath(href), location ]));

  parser.on('customElementStartTag', name => {
    usedImports[name] = true;
  });

  parser.on('end', () => {
    for (const [ name, location ] of imports) {
      if (usedImports[name]) {
        continue;
      }
      onError({
        message: `Component <${name}> was imported but never used`,
        location,
      });
    }
  });
};
