/**
 * CLI
 * @module lib/CLI
 */
/* eslint-disable no-console */

const ConsoleReporter = require('./reporters/ConsoleReporter');
const Linter = require('./Linter');
const Options = require('./Options');
const rules = require('./rules');

const resolvePatterns = require('./util/resolvePatterns');

function enabledRules({ rules: ruleNames }) {
  if (!(ruleNames && ruleNames.length)) { return rules; }

  return ruleNames.reduce(
    (enabled, name) => Object.assign({}, enabled, { [name]: rules[name] })
  , {});
}

function lint(files, options) {
  return Linter.lintFiles(files, enabledRules(options))
    .then(results => new ConsoleReporter(options).report(results));
}

/**
 * @function CLI.execute
 * @param {string[]} argv - Command line arguments
 * @returns {number|Promise<number>}
 */
function execute(argv) {
  const opts = Options.parse(argv);

  if (opts.version) {
    /* eslint-disable global-require */
    console.log(`v${require('../package.json').version}`);
    return 0;
  }

  if (opts.help || !opts._.length) {
    console.log(Options.generateHelp());
    return 0;
  }

  return lint(resolvePatterns(opts), opts);
}

module.exports = { execute };
