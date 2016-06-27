/** @module gulp-polymer-lint */

const { Transform } = require('stream');
const { PluginError, log: _log } = require('gulp-util');
const ConsoleReporter = require('../reporters/ConsoleReporter');
const { lintData } = require('../Linter');

const PLUGIN_NAME = 'polymer-lint';

function lint(file, options = {}) {
  return new Promise((resolve, reject) => {
    lintData(file.contents, { filename: file.path }, options)
      .then(resolve)
      .catch(reason => reject(new PluginError(PLUGIN_NAME, reason, { showStack: true })));
  });
}

const log = _log.bind(null, `[${PLUGIN_NAME}]`);

function _reporter() {
  return new ConsoleReporter({
    write(str) {
      // unindent, strip trailing newline(s)
      const stripped = str.replace(/\n*$/, '');
      return stripped && log(stripped);
    }
  });
}

/**
 * @function polymerLint
 * @param {Object} [options={}]
 * @param {string[]} [options.rules=]
 *   An array of rule names to enable (default is all rules)
 * @return {external:stream.Transform}
 *
 * @example
 * const gulp = require('gulp');
 * const polymerLint = require('polymer-lint/gulp');
 *
 * gulp.task('default', () => {
 *   return gulp.src('./src/components/*.html')
 *     .pipe(polymerLint({ rules: ['no-missing-import', 'no-unused-import'] }))
 *     .pipe(gulp.dest('./dist/'));
 * });
 */
module.exports = function polymerLint(options = {}) {
  let totalErrors = 0;
  const transformStream = new Transform({ objectMode: true });
  const reporter = _reporter();

  transformStream._transform = function _transform(file, encoding, callback) {
    if (file.isNull()) {
      callback(null, file);
      return;
    }

    lint(file, options).then(({ errors, context }) => {
      try {
        totalErrors += reporter.reportFile(errors, context);
        callback(null, file);
      } catch (err) {
        this.emit('error', new PluginError(PLUGIN_NAME, err));
      }
    })
    .catch(err => this.emit('error', err));

    return;
  };

  transformStream.on('end', function() {
    try {
      reporter.reportSummary(totalErrors);
    } catch (err) {
      this.emit('error', new PluginError(PLUGIN_NAME, err));
    }
  });

  return transformStream;
};
