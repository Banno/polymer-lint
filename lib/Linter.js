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
   * @param {Object.<string, Function[]>} enabledLinters
   * @param {LinterOptions} [options={}]
   */
  constructor(enabledLinters, options={}) {
    this.enabledLinters = enabledLinters;
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
    const file = fs.createReadStream(filename);
    return this.lintStream(fs.createReadStream(filename), { filename });
  }

  /**
   * @param {Stream} stream
   * @param {{filename: string=}} [metadata={}]
   * @returns {Promise<Array[]|Error>}
   */
  lintStream(stream, metadata={}) {
    const promises = [];
    const errors = [];

    const onError = (linterName) => {
      return (...args) => {
        errors.push([ linterName, ...args ]);
      }
    };

    for (let linterName of Object.keys(this.enabledLinters)) {
      let lint = this.enabledLinters[linterName];
      lint(metadata.filename, this.parser, onError(linterName));

      let promise = new Promise((resolve, reject) => {
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
 * @param {Object.<string, Function>} enabledLinters
 * @param {LinterOptions} [options={}]
 */
Linter.lintFiles = function lintFiles(filenames, enabledLinters, options={}) {
  const linter = new Linter(enabledLinters, options);
  return linter.lintFiles(filenames);
};

module.exports = Linter;
