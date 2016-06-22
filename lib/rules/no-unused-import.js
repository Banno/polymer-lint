/** @file Rule: no-unused-import */
const componentNameFromPath = require('../util/componentNameFromPath');

/**
 * Checks if all imported components are used.
 *
 * @function no-unused-import
 * @memberof module:lib/rules
 * @param {Linter.LintStreamContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {void}
 */
module.exports = function noUnusedImport(context, parser, onError) {
  const imports = [];
  const usedImports = {};

  parser.on('importTag', (href, location) => {
    const name = componentNameFromPath(href);
    if (name) {
      /**
       * Skip imports that aren't valid component names
       * @todo Is this the correct behavior?
       */
      imports.push([ name, location ]);
    }
  });

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
