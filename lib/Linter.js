/**
 * Linter
 * @module lib/Linter
 */

const fs = require('fs');

const SAXParser = require('./SAXParser');

/**
 * @typedef LinterOptions
 * @type {object}
 */

/**
 * @class Linter
 */
class Linter {
  /**
   * @param {Object.<string, Function[]>} enabledRules
   * @param {LinterOptions} [options={}]
   */
  constructor(enabledRules, options = {}) {
    this.enabledRules = enabledRules;
    this.options = options;
    this.parser = new SAXParser({ locationInfo: true });
  }

  /**
   * @param {string[]} filenames
   * @returns {Promise<Array[]|Error>}
   */
  lintFiles(filenames) {
    const promises = [];

    return new Promise((resolve, reject) => {
      for (const filename of filenames) {
        promises.push(this.lintFile(filename));
      }

      Promise.all(promises)
        .then((errorsArrays) => {
          resolve([].concat(errorsArrays));
        })
        .catch(reject);
    });
  }

  /**
   * @param {string} filename
   * @returns {Promise<Array[]|Error>}
   */
  lintFile(filename) {
    return this.lintStream(fs.createReadStream(filename), { filename });
  }

  /**
   * @param {Stream} stream
   * @param {{filename: string=}} [context={}]
   * @returns {Promise<Array[]|Error>}
   */
  lintStream(stream, context = {}) {
    const promises = [];
    const errors = [];

    const onError = (ruleName) =>
      (...args) => errors.push([ ruleName, ...args ]);

    for (const ruleName of Object.keys(this.enabledRules)) {
      const rule = this.enabledRules[ruleName];
      rule(context, this.parser, onError(ruleName));

      const promise = new Promise((resolve, reject) => {
        try {
          stream.pipe(this.parser).on('end', resolve);
        } catch (err) {
          reject(err);
        }
      });

      promises.push(promise);
    }

    return new Promise((resolve, reject) => {
      try {
        Promise.all(promises)
          .then(() => resolve(errors))
          .catch(reject);
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
 * @param {Object.<string, Function>} enabledRules
 * @param {LinterOptions} [options={}]
 */
Linter.lintFiles = function lintFiles(filenames, enabledRules, options = {}) {
  const linter = new Linter(enabledRules, options);
  return linter.lintFiles(filenames);
};

module.exports = Linter;
