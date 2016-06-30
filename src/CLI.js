/**
 * CLI engine
 * @module lib/CLI
 */
/* eslint-disable no-console */

const ConsoleReporter = require('./reporters/ConsoleReporter');
const Linter = require('./Linter');
const Options = require('./Options');

const resolvePatterns = require('./util/resolvePatterns');

function lint(files, options) {
  return Linter.lintFiles(files, options)
    .then(results => {
      const numErrors = new ConsoleReporter(options).report(results);
      return numErrors ? 1 : 0;
    });
}

/**
 * Parse the command line arguments and run the linter
 *
 * @memberof module:lib/CLI
 * @param {string[]} argv - Command line arguments
 * @return {number|Promise<number>}
 *   A Promise that resolves with a numeric exit code
 */
function execute(argv) {
  const opts = Options.parse(argv);

  if (opts.version) {
    /* eslint-disable global-require */
    console.log(`v${require('../package.json').version}`);
    return Promise.resolve(0);
  }

  if (opts.help || !opts._.length) {
    console.log(Options.generateHelp());
    return Promise.resolve(0);
  }

  return lint(resolvePatterns(opts), opts);
}

module.exports = { execute };
