'use strict';

const path = require('path');

var _require = require('sprintf-js');

const sprintf = _require.sprintf;

const _chalk = require('chalk');

// Drop errors for rules that are disabled by the `bplint-disable` directive
function filterErrors(errors, stack) {
  return errors.filter(_ref => {
    let location = _ref.location;
    let rule = _ref.rule;

    const directives = stack.snapshotAtLocation(location);
    const disabledRules = directives.getDirectiveArgs('bplint-disable');
    return disabledRules.indexOf(rule) < 0;
  });
}

/**
 * Calculates the maximum width of each of the line, col, and message
 * parts of the error output, e.g.:
 *
 * @private
 * @example
 * const errors = [
 *   { message: 'This message has 30 characters',
 *     location: { line: 100, col: 5 },
 *   },
 *   { message: 'This has 17 chars',
 *     location: { line: 2, col: 20 },
 *   };
 * ];
 *
 * lineMetrics(errors);
 * // => { message: 30, line: 3, col: 2 }
 *
 * @param {Linter.LinterError[]} errors
 * @return {{line: number, col: number, message: number}}
 */
function lineMetrics(errors) {
  const initialValues = { message: 0, line: 0, col: 0 };

  return errors.reduce((vals, _ref2) => {
    let message = _ref2.message;
    var _ref2$location = _ref2.location;
    let line = _ref2$location.line;
    let col = _ref2$location.col;
    return { message: Math.max(vals.message, message.length),
      line: Math.max(vals.line, line.toString().length),
      col: Math.max(vals.col, col.toString().length)
    };
  }, initialValues);
}

/**
 * Formats the output line with the widths given in `metrics`
 *
 * @private
 * @param {{
 *   rule: string,
 *   message: string,
 *   location: parse5.LocationInfo
 * }} error
 * @param {{line: number, col: number, message: number}} metrics
 * @return {string}
 */
function formatLine(_ref3, metrics) {
  let rule = _ref3.rule;
  let message = _ref3.message;
  let location = _ref3.location;
  const line = location.line;
  const col = location.col;
  const lineW = metrics.line;
  const colW = metrics.col;
  const msgW = metrics.message;

  const loc = sprintf(`%${ lineW }d:%-${ colW }d`, line, col);
  const msg = sprintf(`%-${ msgW }s`, message);
  return `  ${ loc }  ${ msg }  ${ rule }`;
}

// Private methods
const write = Symbol('write');
const writeFilename = Symbol('writeFilename');
const writeErrors = Symbol('writeErrors');
const writeError = Symbol('writeError');

// Private properties
const chalk = Symbol('chalk');

class ConsoleReporter {
  /**
   * @constructor
   * @param {stream.Writable|fs.WriteStream|Object} outOrOptions
   * @param {?Object} options
   */
  constructor() {
    let outOrOptions = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    let options = arguments[1];

    let opts;

    if (outOrOptions.write && typeof outOrOptions.write === 'function') {
      this.out = outOrOptions;
      opts = options || {};
    } else {
      this.out = process.stdout;
      opts = outOrOptions || {};
    }

    this[chalk] = new _chalk.constructor({ enabled: opts.color });
  }

  /**
   * Output a report for the given `results`
   * @param {Linter.LintFileResult[]} results
   * @return {number} - The number of errors reported
   */
  report(results) {
    const numErrors = results.reduce((num, _ref4) => {
      let errors = _ref4.errors;
      let context = _ref4.context;
      return num + this.reportFile(errors, context);
    }, 0);

    if (numErrors > 0) {
      this.reportSummary(numErrors);
    }

    return numErrors;
  }

  /**
   * Output a report for the given errors
   * @param {Linter.LintError[]} errors
   * @param {Linter.LintFileContext} context
   * @return {number} - The number of errors reported
   */
  reportFile(errors, context) {
    const filename = context.filename;
    const stack = context.stack;

    const errorsFiltered = filterErrors(errors, context.stack);

    if (errorsFiltered.length) {
      this[writeFilename](filename);
      this[writeErrors](errorsFiltered, stack);
      this[write]();
    }

    return errorsFiltered.length;
  }

  /**
   * Report the total number of errors
   * @param {number} num - The number of errors reported
   * @return {number} - The number of errors reported (same as `num` argument)
   */
  reportSummary(num) {
    if (num === 0) {
      return;
    }
    this[write](this[chalk].bold.red(`\u2716 ${ num } error${ num === 1 ? '' : 's' }`));
    return num;
  }

  [writeFilename](filename) {
    const relativePath = path.relative(process.cwd(), filename);
    this[write](this[chalk].underline(relativePath));
  }

  [writeErrors](errors) {
    const metrics = lineMetrics(errors);

    for (const error of errors) {
      this[writeError](error, metrics);
    }
  }

  [writeError](error, metrics) {
    this[write](formatLine(error, metrics));
  }

  [write]() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this.out.write(`${ args.join(' ') }\n`);
  }
}

module.exports = ConsoleReporter;