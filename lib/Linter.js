/**
 * Linter
 * @module lib/Linter
 */

const fs = require('fs');

const SAXParser = require('./SAXParser');
const linters = require('./linters');

/**
 * @typedef LinterOptions
 * @type {object}
 */

/**
 * @class Linter
 */
class Linter {
  /**
   * @param {LinterOptions} options
   */
  constructor(options) {
    this.options = options;
    this.parser = new SAXParser({ locationInfo: true });
  }

  /**
   * @param {string[]} filenames
   * @returns {Promise<Array[]|Error>}
   */
  lintFiles(filenames) {
    const promises = [];

    for (let filename of filenames) {
      promises.push(this.lintFile(filename));
    }

    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((errorsArrays) => {
          resolve([].concat(...errorsArrays));
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
   * @param {{filename: string=}} metadata
   * @returns {Promise<Array[]|Error>}
   */
  lintStream(stream, metadata) {
    const promises = [];
    const errors = [];

    const onError = (linterName) => {
      return (message, location) => {
        errors.push([ linterName, message, location ]);
      };
    };

    for (let linterName of Object.keys(linters)) {
      let lint = linters[linterName];
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
 * @param {LinterOptions} [options={}]
 */
Linter.lintFiles = function lintFiles(filenames, options={}) {
  const linter = new Linter(options);
  return linter.lintFiles(filenames);
};

module.exports = Linter;
