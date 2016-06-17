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
    const promises = [];

    return new Promise((resolve, reject) => {
      for (const filename of filenames) {
        promises.push(this.lintFile(filename));
      }

      Promise.all(promises)
        .then((lintFileResult) => resolve([].concat(lintFileResult)))
        .catch(reject);
    });
  }

  /**
   * Returns a promise
   * @param {string} filename
   * @returns {Promise<LintFileResult|Error>}
   */
  lintFile(filename) {
    const context = { filename };

    return new Promise((resolve, reject) => {
      try {
        this.lintStream(fs.createReadStream(filename), context)
          .then(resolve);
      } catch (err) {
        reject(err);
      }
    });
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
      rule(ctx, parser, onError(ruleName));
    }

    return new Promise((resolve, reject) => {
      try {
        stream.pipe(parser).on('end', () => {
          const context = Object.assign({ stack }, ctx);
          resolve({ errors, context });
        });
      } catch (err) {
        reject(err);
      }
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
