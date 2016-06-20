/**
 * ConsoleReporter
 * @module lib/reporters/ConsoleReporter
 */

const path = require('path');
const { sprintf } = require('sprintf-js');

/**
 * Drop errors for rules that are disabled by the `bplint-disable`
 * directive
 */
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
 * @returns {{line: number, col: number, message: number}}
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
 * @param {{
 *   rule: string,
 *   message: string,
 *   location: parse5.LocationInfo
 * }} error
 * @param {{line: number, col: number, message: number}} metrics
 * @returns {string}
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

class ConsoleReporter {
  /**
   * @constructor
   * @param {stream.Writable} out
   */
  constructor(out = process.stdout) {
    this.out = out;
  }

  /**
   * @param {LintFileResult[]} results
   * @returns {}
   */
  report(results) {
    for (const { errors, context } of results) {
      this.reportFile(errors, context);
    }
  }

  /**
   * @param {LintFileResult} fileResult
   * @returns {}
   */
  reportFile(errors, context) {
    const { filename, stack } = context;
    const errorsFiltered = filterErrors(errors, context.stack);

    if (!errorsFiltered.length) { return; }

    this[writeFilename](filename);
    this[writeErrors](errorsFiltered, stack);
    this[write]();
  }

  [writeFilename](filename) {
    const relativePath = path.relative(process.cwd(), filename);
    this[write](relativePath);
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

  [write](...args) {
    this.out.write(`${args.join(' ')}\n`);
  }
}

module.exports = ConsoleReporter;
