'use strict';

// util.isValidCustomElementName
/*
 * Background:
 *
 * Custom Elements (W3C Working Draft 09 June 2016)
 * https://www.w3.org/TR/custom-elements/#valid-custom-element-name
 *
 * > A **valid custom element name** is a sequence of characters `name`
 * > that meets all of the following requirements:
 * >
 * >   * `name` must match the PotentialCustomElementName production:
 * >
 * >         PotentialCustomElementName ::=
 * >             [a-z] (PCENChar)* '-' (PCENChar)*
 * >
 * >         PCENChar ::=
 * >             "-" | "." | [0-9] | "_" | [a-z] | #xB7 | [#xC0-#xD6]
 * >             | [#xD8-#xF6] | [#xF8-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D]
 * >             | [#x203F-#x2040] | [#x2070-#x218F] | [#x2C00-#x2FEF]
 * >             | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD]
 * >             | [#x10000-#xEFFFF]
 * >
 * >     This uses the EBNF notation from the XML specification.
 */
const PCEN_CHAR = '(?:' + '[' + '-.0-9_a-z\xb7' + '\xc0-\xd6\xd8-\xf6\xf8-\u037d' + '\u037f-\u1fff\u200c\u200d\u203f\u2040' + '\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff' + '\uf900-\ufdcf\ufdf0-\ufffd' + ']|' + '[\ud800-\udb7f][\udc00-\udfff]' + ')';

const POTENTIAL_CUSTOM_ELEMENT_NAME = new RegExp(`^[a-z]${ PCEN_CHAR }*-${ PCEN_CHAR }*$`);

/*
 * >   * `name` must not be any of the following:
 * >
 * >       * annotation-xml
 * >       * color-profile
 * >       * font-face
 * >       * font-face-src
 * >       * font-face-uri
 * >       * font-face-format
 * >       * font-face-name
 * >       * missing-glyph
 */
const DISALLOWED_NAMES = ['annotation-xml', 'color-profile', 'dom-module', 'font-face', 'font-face-src', 'font-face-uri', 'font-face-format', 'font-face-name', 'missing-glyph'].reduce((list, name) => Object.assign(list, { [name]: true }), {});

/**
 * Tests if the given string is a valid component name
 *
 * @function isValidCustomElementName
 * @memberof module:lib/util
 * @param {string} str
 * @return {boolean}
 */
module.exports = function isValidCustomElementName(str) {
  return typeof str === 'string' && POTENTIAL_CUSTOM_ELEMENT_NAME.test(str) && !DISALLOWED_NAMES[str];
};