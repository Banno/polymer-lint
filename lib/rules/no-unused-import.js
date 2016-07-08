'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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
      imports.push([name, location]);
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
    for (const _ref of imports) {
      var _ref2 = _slicedToArray(_ref, 2);

      const name = _ref2[0];
      const location = _ref2[1];

      if (usedImports[name]) {
        continue;
      }
      onError({
        message: `Component '${ name }' was imported but never used`,
        location
      });
    }
  });
};