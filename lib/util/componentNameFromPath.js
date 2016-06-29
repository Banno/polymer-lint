'use strict';

// util.componentNameFromPath

var _require = require('path');

const basename = _require.basename;

const isValidCustomElementName = require('./isValidCustomElementName');

const EXTENSION = '.html';

/**
 * Returns the name of the component expected to be defined by the given path.
 * If the path doesn't include a valid component name, returns `null`.
 *
 * @function componentNameFromPath
 * @memberof module:lib/util
 * @param {string} path
 * @param {string} [extension=.html]
 * @return {string|null}
 *
 * @example
 * componentNameFromPath('/foo/bar/baz-component.html');
 * // => 'baz-component'
 *
 * componentNameFromPath('/foo/bar/dom-module.html');
 * // => null
 */
module.exports = function componentNameFromPath(path) {
  let extension = arguments.length <= 1 || arguments[1] === undefined ? EXTENSION : arguments[1];

  if (!(path && path.length)) {
    return null;
  }

  const name = basename(path, extension);
  if (isValidCustomElementName(name)) {
    return name;
  }
  return null;
};