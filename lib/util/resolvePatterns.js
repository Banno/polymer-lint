/**
 * resolvePatterns
 * @module lib/util/resolvePatterns
 */

const path = require('path');
const fs = require('fs');
const glob = require('glob');

/**
 * If the given pattern is a directory that exists, append `/** /*.ext` to
 * match all files in the tree.
 */
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
    ) { return pattern; }

    return pattern.replace(/[\/\\]?$/, suffix);
  };
}

function resolvePatterns(options) {
  let g = { sync: true };

  const paths =
    options._.map(processPattern(options))
      .reduce((_paths, pattern) => {
        g = new glob.Glob(pattern, g);
        return _paths.concat(g.found);
      }, []);

  return [...new Set(paths)]; // unique paths
}

module.exports = resolvePatterns;
