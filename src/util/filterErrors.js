// util/filterErrors

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
  return errors.filter(({ location, rule }) => {
    const directives = stack.snapshotAtLocation(location);
    const disabledRules = directives.getDirectiveArgs('bplint-disable');
    return disabledRules.indexOf(rule) < 0;
  });
};
