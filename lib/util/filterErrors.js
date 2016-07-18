'use strict';

// util/filterErrors

// Given an array of directives, returns the names of rules disabled by
// bplint-disable directives and not subsequently re-enabled by bplint-enable.
function disabledRules(directives) {
  return directives.reduce((disabled, _ref) => {
    let name = _ref.name;
    let args = _ref.args;

    if (name === 'bplint-disable') {
      for (const ruleName of args) {
        disabled[ruleName] = true;
      }
    } else if (name === 'bplint-enable') {
      for (const ruleName of args) {
        if (disabled[ruleName]) {
          disabled[ruleName] = false;
        }
      }
    }

    return disabled;
  }, {});
}

/**
 * Takes a {@link Linter.LintError} array and {@link DirectiveStack} and returns a new
 * array with only those errors enabled according to the bplint-enable,
 * bplint-disable et al directives in the DirectiveStack.
 *
 * @function filterErrors
 * @memberof module:lib/util
 * @param {Linter.LintError[]} errors - The errors to filter
 * @param {DirectiveStack} stack
 * @return {Linter.LintError[]} - The filtered errors
 */
module.exports = function filterErrors(errors, stack) {
  return errors.filter(_ref2 => {
    let location = _ref2.location;
    let rule = _ref2.rule;

    const snapshot = stack.snapshotAtLocation(location);
    const directives = snapshot.getDirectives('bplint-disable', 'bplint-enable');

    return !disabledRules(directives)[rule];
  });
};