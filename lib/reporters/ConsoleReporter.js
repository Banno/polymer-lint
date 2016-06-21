const path = require('path');
const { sprintf } = require('sprintf-js');
const _chalk = require('chalk');

// Drop errors for rules that are disabled by the `bplint-disable` directive
function filterErrors(errors, stack) {
  return errors.filter(({ location, rule }) => {
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
 * @param {Object[]} errors
 * @return {{line: number, col: number, message: number}}
 */
function lineMetrics(errors) {
  const initialValues = { message: 0, line: 0, col: 0 };

  return errors.reduce((vals, { message, location: { line, col } }) => (
    { message: Math.max(vals.message, message.length),
      line: Math.max(vals.line, line.toString().length),
      col: Math.max(vals.col, col.toString().length),
    }
  ), initialValues);
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
function formatLine({ rule, message, location }, metrics) {
  const { line, col } = location;
  const { line: lineW, col: colW, message: msgW } = metrics;
  const loc = sprintf(`%${lineW}d:%-${colW}d`, line, col);
  const msg = sprintf(`%-${msgW}s`, message);
  return `  ${loc} ${msg} ${rule}`;
}

// Private methods
const write = Symbol('write');
const writeFilename = Symbol('writeFilename');
const writeErrors = Symbol('writeErrors');
const writeError = Symbol('writeError');
const writeSummary = Symbol('writeSummary');

// Private properties
const chalk = Symbol('chalk');

class ConsoleReporter {
  /**
   * @constructor
   * @param {stream.Writable|fs.WriteStream|Object} outOrOptions
   * @param {?Object} options
   */
  constructor(outOrOptions = {}, options) {
    let opts, colorEnabled;

    if (outOrOptions.write && typeof outOrOptions.write === 'function') {
      this.out = outOrOptions;
      opts = options || {};
    } else {
      this.out = process.stdout;
      opts = outOrOptions || {};
    }

    if (opts.color === false) {
      colorEnabled = false;
    } else {
      colorEnabled = Boolean(opts.color === true || this.out.isTTY);
    }

    this[chalk] = new _chalk.constructor({ enabled: colorEnabled });
  }

  /**
   * @param {LintFileResult[]} results
   * @return {number} - The number of errors reported
   */
  report(results) {
    const numErrors = results.reduce(
      (num, { errors, context }) => num + this.reportFile(errors, context)
    , 0);

    this[writeSummary](numErrors);

    return numErrors;
  }

  /**
   * @param {LintFileResult} errors
   * @param {LintFileContext} context
   * @return {number} - The number of errors reported
   */
  reportFile(errors, context) {
    const { filename, stack } = context;
    const errorsFiltered = filterErrors(errors, context.stack);

    if (errorsFiltered.length) {
      this[writeFilename](filename);
      this[writeErrors](errorsFiltered, stack);
      this[write]();
    }

    return errorsFiltered.length;
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

  [writeSummary](num) {
    if (num === 0) {
      return;
    }
    this[write](this[chalk].bold.red(`\u2716 ${num} error${num === 1 ? '' : 's'}`));
  }

  [write](...args) {
    this.out.write(`${args.join(' ')}\n`);
  }
}

module.exports = ConsoleReporter;
