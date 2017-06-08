// Rule: icon titles
/**
 * checks that every instance of jha-icon includes a title attribute
 *
 * @function icon-titles
 * @memberof module:lib/rules
 * @param {Linter.LintStreamContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 * @return {void}
 */
module.exports = function iconTitles(context, parser, onError) {
  const iconRegExp = new RegExp(/jha-icon-[\w-]+/);
  parser.on('startTag', (name, attrs, selfClosing, location) => {
    if (
      !name.match(iconRegExp) ||
      (name.match(iconRegExp) &&
        attrs.filter(attr => attr.name === 'title').length)
    ) {
      return;
    }
    onError({
      message: `Icon has no title attribute: ${name}`,
      location
    });
  });
};
