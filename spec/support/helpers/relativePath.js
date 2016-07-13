const { relative, join } = require('path');

/**
 * Returns a path relative to `process.cwd()` for the given path, which may be
 * specified as multiple arguments to be joined.
 *
 * @param {...string} parts
 *   The parts of the path, which will be joined with `path.join`.
 * @return {string} - A path relative to `process.cwd()`.
 */
module.exports = function relativePath(...parts) {
  return `./${relative(process.cwd(), join(...parts))}`;
};
