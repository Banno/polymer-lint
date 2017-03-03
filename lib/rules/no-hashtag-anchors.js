'use strict';

// Rule: no-hashtag-anchors

const locationFromStringOffset = require('../util/locationFromStringOffset');
const MATCH_HASHTAG_ANCHOR = /^#$/;

/**
 * Reports an error if any anchors contain href="#".
 *
 * @function no-hashtag-anchors
 * @memberof module:lib/rules
 * @param {Linter.LintStreamContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {void}
 */
module.exports = function noHashtagAnchors(context, parser, onError) {
  parser.on('startTag', (name, attrs, selfClosing, location) => {
    if (name === 'a') {
      for (const _ref of attrs) {
        const name = _ref.name;
        const value = _ref.value;

        if (name !== 'href') {
          continue;
        }

        const match = value.match(MATCH_HASHTAG_ANCHOR);

        if (!match) {
          continue;
        }

        const attrLocation = location.attrs[name];
        const wholeAttribute = `${name}="${value}"`;

        const startOffsetWithinAttr = name.length + 2 + match.index; // 2 for `="`
        const endOffsetWithinAttr = startOffsetWithinAttr + match[0].length;
        const bindingLocationWithinDocument =
          locationFromStringOffset(wholeAttribute, startOffsetWithinAttr, endOffsetWithinAttr, attrLocation);

        onError({
          message: `Unexpected hashtag anchor`,
          location: bindingLocationWithinDocument
        });
      }
    }
  });
};
