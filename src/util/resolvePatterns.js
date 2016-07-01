// util.resolvePatterns
const path = require('path');
const fs = require('fs');
const glob = require('glob');

// If the given pattern is a directory that exists, append `/** /*.ext` to
// match all files in the tree.
function processPattern({ cwd = process.cwd(), ext } = {}) {
  let suffix = '/**';

  const extensions = (ext || ['html'])
    .map(_ext => (_ext.charAt(0) === '.' ? _ext.substr(1) : _ext));

  if (extensions.length === 1) {
    suffix = `${suffix}/*.${extensions[0]}`;
  } else {
    suffix = `${suffix}/*.{${extensions.join(',')}}`;
  }

  return function _processPattern(pattern) {
    const resolvedPath = path.resolve(cwd, pattern);

    if (!(fs.existsSync(resolvedPath) &&
          fs.statSync(resolvedPath).isDirectory())
    ) {
      return pattern;
    }

    return pattern.replace(/[\/\\]?$/, suffix);
  };
}

/**
 * Iterates over the given array of patterns and returns the concatenated
 * matching file paths. If any pattern is the name of a directory that exists,
 * all files with the given extension(s) in the tree descending from that
 * directory will be returned.
 *
 * @function resolvePatterns
 * @memberof module:lib/util
 * @param {Object} options
 * @param {string} [options.cwd=process.cwd()] - The current working directory
 * @param {string[]} [options.ext=['html']] - The file extension(s) to include
 * @param {string[]} options._ - An array of paths and/or patterns
 * @return {string[]}
 *
 * @example
 * // Given the following directory tree:
 * //
 * //   ├ existing-file.html
 * //   ├ existing-directory/
 * //   │ ├ found-1.html
 * //   │ └ subdirectory/
 * //   │   └ found-2.html
 * //   └ other-dir
 * //     ├ found-3.html
 * //     └ not-traversed-subdir/
 * //       └ not-found.html
 *
 * resolvePatterns([
 *   'existing-file.html',
 *   'existing-directory',
 *   'other-dir/*.html',
 * ]);
 * // => [ 'existing-file.html',
 * //      'existing-directory/found-1.html',
 * //      'existing-directory/subdirectory/found-2.html',
 * //      'other-dir/found-3.html',
 * //    ]
 */
module.exports = function resolvePatterns(options) {
  let g = { sync: true };

  const paths =
    options._.map(processPattern(options))
      .reduce((_paths, pattern) => {
        g = new glob.Glob(pattern, g);
        return _paths.concat(g.found);
      }, []);

  return [...new Set(paths)]; // unique paths
};
