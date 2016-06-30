// Rule: no-unused-import
const componentNameFromPath = require('../util/componentNameFromPath');
const getAttribute = require('../util/getAttribute');
const isValidCustomElementName = require('../util/isValidCustomElementName');

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

  parser.on('startTag', (name, attrs) => {
    let componentName;

    if (name === 'style') {
      // <style include="..."/>
      componentName = getAttribute(attrs, 'include');
    } else if (!isValidCustomElementName(name)) {
      // Extended built-in element, e.g. <button is="...">
      componentName = getAttribute(attrs, 'is');
    }

    if (componentName) {
      usedImports[componentName] = true;
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
