const path = require('path');
const readdirSync = require('fs').readdirSync;

/**
 * Imports all all of the modules in the given directory (except `index.js`) and
 * returns them as an object with keys corresonding to their filenames (with
 * `.js` removed). Does not recurse into subdirectories.
 *
 * @param {string} dirName - The directory
 * @return {Object<string,*>}
 *
 * @example
 * // Suppose directory `/foo` contained `func1.js` and `func2.js`, which
 * // exported functions named `func1` and `func2`, respectively.
 * module.exports = exportDir('/foo');
 * // => { func1: function func1() { ... },
 * //      func2: function func2() { ... } }
 */
module.exports = function exportDir(dirName) {
  return readdirSync(dirName).reduce((modules, filename) => {
    const filepath = path.join(dirName, filename);

    if (path.basename(filepath) === 'index.js' || path.extname(filename) !== '.js') {
      return modules;
    }

    const moduleName = path.basename(filename, '.js');
    const mod = require(filepath);

    return Object.assign({}, modules, { [moduleName]: mod });
  }, {});
};
