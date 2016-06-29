'use strict';

// Rule: component-name-matches-filename
const path = require('path');
const componentNameFromPath = require('../util/componentNameFromPath');

function onDomModuleStartTag(filename, onError) {
  return function _onDomModuleStartTag(id, attrs, selfClosing, location) {
    const expectedComponentName = componentNameFromPath(filename);
    const componentName = id;

    if (componentName === expectedComponentName) {
      return;
    }

    const message = `Expected '${ path.basename(filename) }' to declare ` + `component '${ expectedComponentName }' but it declared '${ componentName }'`;

    onError({ message, location });
  };
}

/**
 * Checks if each component's name matches the name of the file in which
 * it's defined.
 *
 * @function component-name-matches-filename
 * @memberof module:lib/rules
 * @param {Linter.LintFileContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {void}
 */
module.exports = function componentNameMatchesFilename(_ref, parser, onError) {
  let filename = _ref.filename;

  if (filename) {
    parser.on('domModuleStartTag', onDomModuleStartTag(filename, onError));
  }
};