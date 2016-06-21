global.helpers = (global.helpers || {});

const utilInspect = require('util').inspect;

const DEFAULT_OPTS = { depth: 3 };

function inspector(options = {}) {
  const opts = Object.assign({}, DEFAULT_OPTS, options);
  const i = (...args) => utilInspect(...args, opts);

  return function inspect(strings, ...values) {
    return strings.reduce((out, s, idx) =>
      `${out}${s}${idx < values.length ? i(values[idx]) : ''}`
    , '');
  };
}

const DEFAULT_INSPECT = inspector();

/**
 * helpers.inspect
 *
 * A tagged template function that automatically calls `util.inspect` on
 * interpolated values in template string literals.
 *
 * If called with an options object, `helpers.inspect` will return a tagged
 * template function that passes the options to `util.inspect`.
 *
 * @example
 *
 *     const foo = 'xyz';
 *     const bar = { a: { b: { c: 'def' } } };
 *
 *     // Without helpers.inspect
 *     console.log(`foo is ${foo} and bar is ${bar}`);
 *     // => foo is xyz and bar is [object Object]
 *
 *     // With helpers.inspect
 *     console.log(
 *       helpers.inspect`foo is ${foo} and bar is ${bar}`
 *     );
 *     // => foo is 'xyz' and bar is { a: { b: { c: 'def' } } }
 *
 *     // With options
 *     console.log(
 *       helpers.inspect({ depth: 0 })`foo is ${foo} and bar is ${bar}`
 *     );
 *     // => foo is 'xyz' and bar is { a: [Object] }
 *
 * @param {string[]|Object} stringsOrOpts
 * @param {...*} values
 * @return {string}
 */
function inspect(stringsOrOpts, ...values) {
  if (Array.isArray(stringsOrOpts)) {
    return DEFAULT_INSPECT(stringsOrOpts, ...values);
  }
  return inspector(stringsOrOpts);
}

module.exports = inspect;
