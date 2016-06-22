/** @file Linter */
const fs = require('fs');
const SAXParser = require('./SAXParser');
const ScopedDirectiveStack = require('./ScopedDirectiveStack');

/**
 * @typedef LinterOptions
 * @type {Object}
 * @memberof Linter
 */

/**
 * @typedef LintStreamContext
 * @type {Object}
 * @property {ScopedDirectiveStack} stack
 * @memberof Linter
 */

/**
 * @typedef LintFileContext
 * @extends {Linter.LintStreamContext}
 * @type {Object}
 * @property {string} filename
 * @memberof Linter
 */

/**
 * @typedef LintStreamResult
 * @type {Object}
 * @property {LintError[]} errors
 * @property {Linter.LintStreamContext} context
 * @memberof Linter
 */

/**
 * @typedef LintFileResult
 * @extends {LintStreamResult}
 * @type {Object}
 * @property {Linter.LintFileContext} context
 * @memberof Linter
 */

/**
 * Callback invoked when a {@link Rule} finds a problem
 *
 * @callback OnErrorCallback
 * @param {string} message
 * @param {LocationInfo} location
 */

function locationSort({ location: locA }, { location: locB }) {
  if (locA.line === locB.line) {
    return locA.col - locB.col;
  }
  return locA.line - locB.col;
}

function sortByLocation(errors) {
  return errors.slice().sort(locationSort);
}

class Linter {
  /**
   * @constructor
   * @param {Rules} enabledRules - Rules to execute
   * @param {Linter.LinterOptions} [options={}]
   */
  constructor(enabledRules, options = {}) {
    /** @member {Rules} */ this.enabledRules = enabledRules;
    /** @member {Linter.LinterOptions} */ this.options = options;
  }

  /**
   * Lint the given files
   * @param {string[]} filenames - The paths of the files to lint
   * @return {Promise<Linter.LintFileResult[]|Error>}
   */
  lintFiles(filenames) {
    return Promise.all(
      filenames.map(filename => this.lintFile(filename)));
  }

  /**
   * Lint the given file
   * @param {string} filename
   * @return {Promise<Linter.LintFileResult|Error>}
   */
  lintFile(filename) {
    const context = { filename };
    return this.lintStream(fs.createReadStream(filename), context);
  }

  /**
   * @param {external:stream.Readable} stream
   * @param {{filename: ?string}} [context={}]
   * @return {Promise<Linter.LintStreamResult|Error>}
   */
  lintStream(stream, context = {}) {
    const parser = new SAXParser({ locationInfo: true });
    const errors = [];

    const stack = new ScopedDirectiveStack();
    stack.listenTo(parser);

    const onError = rule =>
      error => errors.push(Object.assign({ rule }, error));

    for (const ruleName of Object.keys(this.enabledRules)) {
      const rule = this.enabledRules[ruleName];

      if (rule) {
        rule(context, parser, onError(ruleName));
        continue;
      }

      onError(ruleName)({
        message: `Definition for rule '${ruleName}' was not found`,
        location: { line: 1, col: 1 },
      });
    }

    return new Promise((resolve, reject) => {
      stream.pipe(parser)
        .on('end', () => {
          const ctx = Object.assign({ stack }, context);
          resolve({ errors: sortByLocation(errors), context: ctx });
        })
        .on('error', reject);
    });
  }
}

/**
 * @function lintFiles
 * @memberof Linter
 * @static
 * @param {string[]} filenames
 * @param {Rules} enabledRules
 * @param {Linter.LinterOptions} [options={}]
 * @return {Promise<Linter.LintFileResult[]|Error>}
 */
Linter.lintFiles = function lintFiles(filenames, enabledRules, options = {}) {
  const linter = new Linter(enabledRules, options);
  return linter.lintFiles(filenames);
};

module.exports = Linter;
