/**
 * component-name-matches-filename
 * @module lib/linters/component-name-matches-filename
 */

/**
 * @external parse5
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation}
 */

/**
 * Callback invoked when this linter finds a problem
 *
 * @callback onErrorCallback
 * @param {string} message
 * @param {parse5.LocationInfo} location
 */

const path = require('path');
const inspect = require('util').inspect;

function filenameToComponentName(filename) {
  return path.basename(filename, '.html');
}

function onDomModuleStartTag(filename, onError) {
  return function _onDomModuleStartTag(id, attrs, selfClosing, location) {
    const expectedComponentName = filenameToComponentName(filename);
    const componentName = id;

    if (componentName === expectedComponentName) { return; }

    onError(
      `Expected ${inspect(filename)} to declare component ${inspect(expectedComponentName)}; it declared ${inspect(componentName)}`,
      location
    );
  };
}

/**
 * @function componentNameMatchesFilename
 * @param {string} filename
 * @param {SAXParser} parser
 * @return {}
 */
module.exports = function componentNameMatchesFilename(filename, parser, onError) {
  parser.on('domModuleStartTag', onDomModuleStartTag(filename, onError));
};
