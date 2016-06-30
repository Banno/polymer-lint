"use strict";

/**
 * Given an `attributes` array of the form [ { name: string, value: string }, ... ],
 * returns the `value` property of the first object with a `name`
 * matching the given `attributeName`.
 * @function getAttribute
 * @param {Array.<{name: string, value: string}>} attributes
 *   An array of attribute objects
 * @param {string} attributeName
 *   The name of the attribute to get the value of
 * @return {string} - The attribute value
 */
module.exports = function getAttribute(attributes, attributeName) {
  const attr = attributes.find(_ref => {
    let name = _ref.name;
    return name === attributeName;
  });
  return attr && attr.value;
};