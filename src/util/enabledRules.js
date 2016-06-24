// util/enabledRules
const rules = require('../rules');

/**
 * Returns a {@link Rules} object containing the rules named in the `rules`
 * property of the given `options`. If no rules are given, all available rules
 * are returned.
 *
 * @function enabledRules
 * @memberof module:lib/util
 * @param {Object} options
 * @param {string} [options.rules=[]]
 * @return {Rules}
 */
module.exports = function enabledRules({ rules: ruleNames = [] }) {
  if (!(ruleNames && ruleNames.length)) {
    return rules;
  }

  return ruleNames.reduce((enabled, name) =>
    Object.assign({}, enabled, { [name]: rules[name] })
  , {});
};
