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
 * >
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

// Arrays below represent code point ranges
const PCEN_CHAR_CLASSES = [
  /* eslint-disable array-bracket-spacing */
  '-.0-9_a-z', '\u{b7}',
  [0xc0, 0xd6], [0xd8, 0xf6], [0xf8, 0x37d],
  [0x37f, 0x1fff], [0x200c, 0x200d], [0x203f, 0x2040],
  [0x2070, 0x218f], [0x2c00, 0x2fef], [0x3001, 0xd7ff],
  [0xf900, 0xfdcf], [0xfdf0, 0xfffd], [0x10000, 0xeffff],
];

const HYPHEN = '-'.codePointAt(0);

const PCEN_CHAR = `[${
  // Convert range arrays into RegExp range expressions,
  // e.g. [0x61, 0x66] -> "a-f".
  PCEN_CHAR_CLASSES.map(cls => {
    if (Array.isArray(cls)) {
      return String.fromCodePoint(cls[0], HYPHEN, cls[1]);
    }

    return cls;
  }).join('')
}]`;

const POTENTIAL_CUSTOM_ELEMENT_NAME =
  new RegExp(`^[a-z]${PCEN_CHAR}*-${PCEN_CHAR}*$`, 'u');

const DISALLOWED_NAMES = [
  'annotation-xml', 'color-profile', 'dom-module',
  'font-face', 'font-face-src', 'font-face-uri',
  'font-face-format', 'font-face-name', 'missing-glyph',
].reduce((list, name) => Object.assign(list, { [name]: true }), {});

/**
 * Tests if the given string is a valid component name
 *
 * @function isValidCustomElementName
 * @memberof module:lib/util
 * @param {string} str
 * @return {boolean}
 */
module.exports = function isValidCustomElementName(str) {
  return typeof str === 'string' &&
    POTENTIAL_CUSTOM_ELEMENT_NAME.test(str) &&
    !DISALLOWED_NAMES[str];
};
