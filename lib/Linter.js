'use strict';

// Linter
const fs = require('fs');

var _require = require('buffer');

const Buffer = _require.Buffer;

var _require2 = require('stream');

const Stream = _require2.Stream;
const PassThrough = _require2.PassThrough;

var _require3 = require('util');

const isString = _require3.isString;

var _require4 = require('./util');

const enabledRules = _require4.enabledRules;

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
 * @property {string} filename=
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
 * @typedef LintError
 * @type {Object}
 * @property {string} message - The error description
 * @property {string} rule - The rule name
 * @property {SAXParser.LocationInfo} location
 *   The source location of the error
 */

/**
 * @typedef LintStreamResult
 * @type {Object}
 * @property {Linter.LintError[]} errors
 * @property {Linter.LintStreamContext} context
 * @memberof Linter
 */

/**
 * @typedef LintFileResult
 * @extends {Linter.LintStreamResult}
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

function locationSort(_ref, _ref2) {
  let locA = _ref.location;
  let locB = _ref2.location;

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
  constructor(enabledRules) {
    let options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    /** @member {Rules} */this.enabledRules = enabledRules;
    /** @member {Linter.LinterOptions} */this.options = options;
  }

  /**
   * Lint the given files
   * @param {string[]} filenames - The paths of the files to lint
   * @return {Promise<Linter.LintFileResult[]|Error>}
   */
  lintFiles(filenames) {
    return Promise.all(filenames.map(filename => this.lintFile(filename)));
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
   * Lint the contents of the given readable stream
   * @param {external:stream.Readable} stream
   * @param {Linter.LintStreamContext} context
   * @return {Promise<Linter.LintStreamResult|Error>}
   */
  lintStream(stream, context) {
    const parser = new SAXParser({ locationInfo: true });
    const errors = [];

    const stack = new ScopedDirectiveStack();
    stack.listenTo(parser);

    const onError = rule => error => errors.push(Object.assign({ rule }, error));

    for (const ruleName of Object.keys(this.enabledRules)) {
      const rule = this.enabledRules[ruleName];

      if (rule) {
        rule(context, parser, onError(ruleName));
        continue;
      }

      onError(ruleName)({
        message: `Definition for rule '${ ruleName }' was not found`,
        location: { line: 1, col: 1 }
      });
    }

    return new Promise((resolve, reject) => {
      stream.pipe(parser).on('end', () => {
        const ctx = Object.assign({ stack }, context);
        resolve({ errors: sortByLocation(errors), context: ctx });
      }).on('error', reject);
    });
  }
}

/**
 * Lint the given files
 *
 * @function lintFiles
 * @memberof Linter
 * @static
 * @param {string[]} filenames
 * @param {Linter.LinterOptions} [options={}]
 * @param {string[]} [options.rules=[]] - Names of rules to enable
 * @return {Promise<Linter.LintFileResult[]|Error>}
 * @see Linter#lintFiles
 */
Linter.lintFiles = function lintFiles(filenames) {
  let options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  const linter = new Linter(enabledRules(options), options);
  return linter.lintFiles(filenames);
};

/**
 * Convenience method that lints the contents of the given string, Stream,
 * or Buffer
 *
 * @function lintData
 * @memberof Linter
 * @static
 * @param {string|external:stream.Readable|external:buffer.buffer} data
 * @param {Linter.LintStreamContext} [context={}]
 * @param {Linter.LinterOptions} [options={}]
 * @param {string[]} [options.rules=[]] - Names of rules to enabled
 * @return {Promise<Linter.LintStreamResult|Error>}
 */
Linter.lintData = function lintData(data) {
  let context = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  let options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  const linter = new Linter(enabledRules(options), options);
  let stream;

  if (data instanceof Stream) {
    stream = data;
  }

  if (data instanceof Buffer || isString(data)) {
    stream = new PassThrough();
    stream.end(data);
  }

  return linter.lintStream(stream, context);
};

module.exports = Linter;