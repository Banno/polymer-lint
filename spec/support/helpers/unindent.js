/**
 * Unindents the given string according to the indentation of the first line. If
 * the first line is empty (consists only of a newline), deletes it and uses the
 * next line as the first line. If the last line consists only of spaces it will
 * be deleted.
 *
 * @function helpers.unindent
 * @param {string} str - The string to be unindented
 * @return {string} - The unindented string
 *
 * @example
 * const text =
 *   unindent(`
 *     foo
 *       bar
 *     baz
 *         qux
 *   `);
 * // => "foo\n  bar\nbaz\n    qux\n"
 */
module.exports = function unindent(str) {
  str = str.replace(/^\n/, '');
  const indent = str.match(/^ +/)[0];
  return str.replace(new RegExp(`^${indent}`, 'gm'), '')
    .replace(/\n +$/, '\n');
};
