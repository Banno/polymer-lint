'use strict';

// Rule: no-typeless-buttons

const BUTTON_TAGS = ['button', 'jha-button'];

/**
 * Reports an error if any button or jha-button tags don't have a type.
 *
 * @function no-typeless-buttons
 * @memberof module:lib/rules
 * @param {Linter.LintStreamContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {void}
 */
module.exports = function noTypelessButtons(context, parser, onError) {
  // Property/attribute binding
  parser.on('startTag', (name, attrs, selfClosing, location) => {
    if (BUTTON_TAGS.indexOf(name) !== -1) {
      for (const _ref of attrs) {
        if (_ref.name === 'type' && _ref.value) {
          return;
        }
      }

      onError({
        message: `Unexpected ${name} without type attribute:`,
        location: location
      });
    }
  });
};
