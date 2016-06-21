/** @file Rule: style-inside-template */
/**
 * Checks if all `<style>` elements are inside `<template>` elements
 *
 * @function style-inside-template
 * @memberof module:lib/rules
 * @param {Linter.LintStreamContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {void}
 */
module.exports = function styleInsideTemplate(context, parser, onError) {
  let insideTemplate = 0;

  parser.on('startTag', (name, attrs, selfClosing, location) => {
    if (name === 'template') {
      if (!selfClosing) {
        insideTemplate++;
      }
      return;
    }

    if (name === 'style' && insideTemplate < 1) {
      onError({ message: '<style> tag outside of <template>', location });
    }
  });

  parser.on('endTag', name => {
    if (name === 'template') {
      insideTemplate--;
    }
  });
};
