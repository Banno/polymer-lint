/**
 * component-name-matches-filename
 *
 * Checks if each component's name matches the name of the file in which
 * it's defined.
 *
 * @module lib/rules/component-name-matches-filename
 */

/**
 * @external parse5
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation}
 */

/**
 * Callback invoked when this rule finds a problem
 *
 * @callback OnErrorCallback
 * @param {string} message
 * @param {parse5.LocationInfo} location
 */

/**
 * @typedef {Object} RuleContext
 * @property {string} [filename]
 */

const path = require('path');

function filenameToComponentName(filename) {
  return path.basename(filename, '.html');
}

function onDomModuleStartTag(filename, onError) {
  return function _onDomModuleStartTag(id, attrs, selfClosing, location) {
    const expectedComponentName = filenameToComponentName(filename);
    const componentName = id;

    if (componentName === expectedComponentName) { return; }

    const message = `Expected '${filename}' to declare component ` +
      `'${expectedComponentName}' but it declared '${componentName}'`;

    onError({ message, location });
  };
}

/**
 * @function componentNameMatchesFilename
 * @param {RuleContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {}
 */
module.exports = function componentNameMatchesFilename({ filename }, parser, onError) {
  parser.on('domModuleStartTag', onDomModuleStartTag(filename, onError));
};
