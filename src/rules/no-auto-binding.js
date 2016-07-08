// Rule: no-auto-binding

const locationFromStringOffset = require('../util/locationFromStringOffset');
const MATCH_AUTO_BINDING = /\{\{.*\}\}/;

/**
 * Reports an error if any automatic bindings (`{{}}`) are encountered.
 *
 * @function no-auto-binding
 * @memberof module:lib/rules
 * @param {Linter.LintStreamContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {void}
 */
module.exports = function noAutoBinding(context, parser, onError) {
  // Property/attribute binding
  parser.on('startTag', (name, attrs, selfClosing, location) => {
    for (const { name, value } of attrs) {
      const match = value.match(MATCH_AUTO_BINDING);

      if (!match) {
        continue;
      }

      /* Suppose the `startTag` event has been emitted for the <a> element in
       * this document:
       *
       * <p>  ┌──────── attribute ────────┐
       *   <a href="/users/{{val}}/profile">Foo</a>
       *      │            │     └── endOffsetWithinAttr = 19
       *      │            └── startOffsetWithinAttr = 13
       *      └── attrLocation = { line: 2, col: 6, startOffset: 9, endOffset: 37 }
       * </p>
       *
       * The below calculates the location of the binding ({{val}}) within the
       * document by first calculating its offset within the attribute
       * (including the attribute name et al) and calling
       * `locationFromStringOffset`.
       */
      const kind = name.endsWith('$') ? 'attribute' : 'property';
      const attrLocation = location.attrs[name];
      const wholeAttribute = `${name}="${value}"`;

      const startOffsetWithinAttr = name.length + 2 + match.index; // 2 for `="`
      const endOffsetWithinAttr = startOffsetWithinAttr + match[0].length;
      const bindingLocationWithinDocument =
        locationFromStringOffset(wholeAttribute,
          startOffsetWithinAttr, endOffsetWithinAttr, attrLocation);

      onError({
        message: `Unexpected automatic binding in ${kind} '${name}': ${match[0]}`,
        location: bindingLocationWithinDocument,
      });
    }
  });

  parser.on('text', (text, location) => {
    const match = text.match(MATCH_AUTO_BINDING);

    if (!match) {
      return;
    }

    const startOffsetWithinText = match.index;
    const endOffsetWithinText = match.index + match[0].length;
    const bindingLocationWithinDocument =
      locationFromStringOffset(text, startOffsetWithinText, endOffsetWithinText, location);

    onError({
      message: `Unexpected automatic binding in text: ${match[0]}`,
      location: bindingLocationWithinDocument,
    });
  });
};
