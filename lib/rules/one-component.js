/**
 * one-component
 *
 * Checks if the file defines exactly one component.
 *
 * @module lib/rules/one-component
 */

/*
 * @function one-component
 * @param {RuleContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {}
 */
module.exports = function oneComponent(context, parser, onError) {
  let count = 0;

  parser.on('domModuleStartTag', (id, attrs, selfClosing, location) => {
    count += 1;
    if (count > 1) {
      onError({
        message: `More than one component defined: ${id}`,
        location,
      });
    }
  });
};
