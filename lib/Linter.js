/**
 * Linter
 * @module lib/Linter
 */

const fs = require('fs');

const SAXParser = require('./SAXParser');
const ScopedDirectiveStack = require('./ScopedDirectiveStack');

/**
 * @typedef LinterOptions
 * @type {object}
 */

/**
 * @typedef LintStreamContext
 * @typedef {{ stack: ScopedDirectiveStack }}
 */

/**
 * @typedef LintFileContext
 * @extends {LintStreamContext}
 * @type {{ filename: string }}
 */

/**
 * @typedef LintStreamResult
 * @type {{ errors: LintError[], context: LintStreamContext }}
 */

/**
 * @typedef LintFileResult
 * @extends {LintStreamResult}
 * @type {{ context: LintFileContext }}
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

/**
 * @class Linter
 */
class Linter {
  /**
   * @param {Object<string, Function[]>} enabledRules
   * @param {LinterOptions} [options={}]
   */
  constructor(enabledRules, options = {}) {
    this.enabledRules = enabledRules;
    this.options = options;
  }

  /**
   * @param {string[]} filenames
   * @returns {Promise<LintFileResult[]|Error>}
   */
  lintFiles(filenames) {
    return Promise.all(
      filenames.map(filename => this.lintFile(filename)));
  }

  /**
   * @param {string} filename
   * @returns {Promise<LintFileResult|Error>}
   */
  lintFile(filename) {
    const context = { filename };
    return this.lintStream(fs.createReadStream(filename), context);
  }

  /**
   * @param {Stream} stream
   * @param {{filename: string=}} [context={}]
   * @returns {Promise<LintStreamResult|Error>}
   */
  lintStream(stream, ctx = {}) {
    const parser = new SAXParser({ locationInfo: true });
    const errors = [];

    const stack = new ScopedDirectiveStack();
    stack.listenTo(parser);

    const onError = (rule) =>
      (error) => errors.push(Object.assign({ rule }, error));

    for (const ruleName of Object.keys(this.enabledRules)) {
      const rule = this.enabledRules[ruleName];

      if (rule) {
        rule(ctx, parser, onError(ruleName));
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
          const context = Object.assign({ stack }, ctx);
          resolve({ errors: sortByLocation(errors), context });
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
 * @param {Object<string, Function>} enabledRules
 * @param {LinterOptions} [options={}]
 * @returns {Promise<LintFileResult[]|Error>}
 */
Linter.lintFiles = function lintFiles(filenames, enabledRules, options = {}) {
  const linter = new Linter(enabledRules, options);
  return linter.lintFiles(filenames);
};

module.exports = Linter;
