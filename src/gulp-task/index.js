/** @module gulp-polymer-lint */

const { Transform } = require('stream');
const { PluginError, log } = require('gulp-util');
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

function _reporter(options) {
  const out = options.out || {
    // Trim trailing newlines
    write(str) {
      log(str.replace(/\n+$/, ''));
    },
  };
  delete options.out;
  return new ConsoleReporter(out, options);
}

/**
 * Convenience function for creating a Transform stream
 *
 * @param {Function} transform - A function to be called for each File received
 * @param {Function} [flush] - A function to be called when the stream ends
 * @returns {external:stream.Transform}
 */
function transform(transform, flush) {
  const stream = new Transform({ objectMode: true });
  stream._transform = transform;
  if (typeof flush === 'function') {
    stream._flush = flush;
  }
  return stream;
}

/**
 * Returns a Transform stream that lints the Files it receives.
 *
 * @function polymerLint
 * @param {Object} [options={}]
 * @param {string[]} [options.rules]
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
  return transform(function(file, enc, callback) {
    if (file.isNull()) {
      callback(null, file);
      return;
    }

    lint(file, options).then(result => {
      try {
        file.polymerLint = result;
        callback(null, file);
      } catch (err) {
        this.emit('error', new PluginError(PLUGIN_NAME, err));
      }
    })
    .catch(err => this.emit('error', err));

    return;
  });
};

/**
 * Returns a Transform stream that reports the linter results for the
 * Files it receives.
 *
 * @function polymerLint.report
 * @param {Object} [options={}] - Options to pass to ConsoleReporter
 * @param {stream.Writable|fs.WriteStream|Object} [options.out]
 *   A stream to write output to (defaults to stdout); will be passed as the
 *   first argument to ConsoleReporter's constructor.
 * @return {external:stream.Transform}
 *
 * @example
 * const gulp = require('gulp');
 * const polymerLint = require('polymer-lint/gulp');
 *
 * gulp.task('default', () => {
 *   return gulp.src('./src/components/*.html')
 *     .pipe(polymerLint({ rules: ['no-missing-import', 'no-unused-import'] }))
 *     .pipe(polymerLint.report())
 *     .pipe(gulp.dest('./dist/'));
 * });
 */
module.exports.report = function report(options = {}) {
  let totalErrors = 0;
  const reporter = _reporter(options);

  return transform(function(file, enc, callback) {
    if (file.isNull()) {
      callback(null, file);
      return;
    }

    try {
      if (file.polymerLint) {
        const { errors, context } = file.polymerLint;
        totalErrors += reporter.reportFile(errors, context);
      }
    } catch (err) {
      this.emit('error', new PluginError(PLUGIN_NAME, err));
    }

    callback(null, file);
    return;
  }, function() {
    try {
      reporter.reportSummary(totalErrors);
    } catch (err) {
      this.emit('error', new PluginError(PLUGIN_NAME, err));
    }
  });
};

/**
 * Returns a Transform stream that waits for the stream to end before reporting
 * the linter results for all Files it has received.
 *
 * @function polymerLint.reportAtEnd
 * @param {Object} [options={}] - Options to pass to ConsoleReporter
 * @param {stream.Writable|fs.WriteStream|Object} [options.out]
 *   A stream to write output to (defaults to stdout); will be passed as the
 *   first argument to ConsoleReporter's constructor.
 * @return {external:stream.Transform}
 *
 * @example
 * const gulp = require('gulp');
 * const polymerLint = require('polymer-lint/gulp');
 *
 * gulp.task('default', () => {
 *   return gulp.src('./src/components/*.html')
 *     .pipe(polymerLint({ rules: ['no-missing-import', 'no-unused-import'] }))
 *     .pipe(polymerLint.reportAtEnd())
 *     .pipe(gulp.dest('./dist/'));
 * });
 */
module.exports.reportAtEnd = function reportAtEnd(options = {}) {
  const results = [];

  return transform((file, enc, callback) => {
    if (file.isNull()) {
      callback(null, file);
      return;
    }

    if (file.polymerLint) {
      results.push(file.polymerLint);
    }

    callback(null, file);
  }, function(file, enc, callback) {
    try {
      const reporter = _reporter(options);
      reporter.report(results);
    } catch (err) {
      this.emit('error', new PluginError(PLUGIN_NAME, err));
    }
  });
};
