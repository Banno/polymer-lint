// Rule: no-missing-imports
const componentNameFromPath = require('../util/componentNameFromPath');
const getAttribute = require('../util/getAttribute');
const isValidCustomElementName = require('../util/isValidCustomElementName');

const POLYMER_BUILTINS = [
  'array-selector', 'custom-style', 'dom-bind',
  'dom-if', 'dom-repeat', 'dom-template'
].reduce((builtIns, name) => {
  builtIns[name] = true;
  return builtIns;
}, {});

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

  const check = (name, location) =>
    POLYMER_BUILTINS[name] || imports[name] || onError({
      message: `Custom element '${name}' used but not imported`,
      location,
    });

  parser.on('importTag', href => {
    const name = componentNameFromPath(href);
    imports[name] = true;
  });

  parser.on('startTag', (name, attrs, selfClosing, location) => {
    if (name === 'style') {
      // <style include="...">
      const componentNames = getAttribute(attrs, 'include');

      if (componentNames) {
        // include attribute can include multiple names; check each
        for (const name of componentNames.trim().split(/\s+/)) {
          check(name, location.attrs.include);
        }
      }

      return;
    }

    if (isValidCustomElementName(name)) {
      return;
    }

    // Extended built-in element, e.g. <button is="...">
    const componentName = getAttribute(attrs, 'is');

    if (componentName) {
      check(componentName, location.attrs.is);
    }
  });

  parser.on('customElementStartTag', (name, attrs, selfClosing, location) => {
    check(name, location);
  });
};
