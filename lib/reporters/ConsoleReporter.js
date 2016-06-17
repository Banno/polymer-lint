/**
 * ConsoleReporter
 * @module lib/reporters/ConsoleReporter
 */

const path = require('path');
const { sprintf } = require('sprintf-js');

function lineMetrics(errors) {
  const initialValues = { message: 0, line: 0, col: 0 };

  return errors.reduce((vals, { message, location: { line, col } }) => (
    { message: Math.max(vals.message, message.length),
      line: Math.max(vals.line, line.toString().length),
      col: Math.max(vals.col, col.toString().length),
    }
  ), initialValues);
}

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
    for (const fileResult of results) {
      if (!fileResult.errors.length) { continue; }
      this.reportFile(fileResult);
      this[write]();
    }
  }

  /**
   * @param {LintFileResult} fileResult
   * @returns {}
   */
  reportFile({ errors, context }) {
    const { filename, stack } = context;
    this[writeFilename](filename);
    this[writeErrors](errors, stack);
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
