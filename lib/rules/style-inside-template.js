/**
 * style-inside-template
 *
 * Checks if all <style> elements are inside <template> elements
 *
 * @module lib/rules/style-inside-template
 */

/*
 * @function style-inside-template
 * @param {RuleContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {}
 */
module.exports = function styleInsideTemplate(context, parser, onError) {
  let insideTemplate = 0;

  parser.on('startTag', (name, attrs, selfClosing, location) => {
    if (name === 'template') {
      if (!selfClosing) { insideTemplate++; }
      return;
    }

    if (name === 'style' && insideTemplate < 1) {
      onError({ message: '<style> tag outside of <template>', location });
    }
  });

  parser.on('endTag', name => {
    if (name === 'template') { insideTemplate--; }
  });
};
