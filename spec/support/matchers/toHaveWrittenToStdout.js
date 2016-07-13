const chalk = require('chalk');
const DiffMatchPatch = require('googlediff');

const COLOR = {
  '1': chalk.green.inverse,
  '0': str => str,
  '-1': chalk.red.strikethrough.inverse,
};

function diff(str1, str2) {
  const dmp = new DiffMatchPatch();
  const diff = dmp.diff_main(str1, str2);
  dmp.diff_cleanupSemantic(diff);

  return diff.reduce((res, [ flag, part ]) => {
    const text = flag === 0 ? part : part.replace('\n', '¶\n');
    return res + COLOR[flag](text);
  }, '');
}

module.exports = function toHaveWrittenToStdout(util, customEqualityTesters) {
  return {
    /**
     * Given the result of executing a command, tests whether the `expected`
     * output was written to stdout. If `expected` is not given, tests whether
     * *any* output (including whitespace) was written.
     *
     * @function toHaveWrittenToStdout
     * @param {{command: string, stdout: string, code: number}} actual
     *   The result of executing a command; see `helpers.exec`
     * @param {string} [expected] - The expected output
     * @return {{pass: boolean, message: ?string}}
     */
    compare({ command, stdout, code }, expected = null) {
      const result = {};
      const exitCodeMsg = `exit code ${code}`;
      let message;

      if (expected === null) {
        result.pass = stdout.length;
        message = `Expected '${command}' to write something to stdout but it ` +
                  `wrote nothing (${exitCodeMsg})`;
      } else if (stdout.length === 0) {
        result.pass = expected.length === 0;
        message = `Expected '${command}' to write '${expected}' to stdout ` +
                  `but it wrote nothing (${exitCodeMsg})`;
      } else {
        result.pass = util.equals(stdout, expected);
        message =
          /* eslint-disable no-unexpected-multiline, prefer-template */
          `Command '${command}' did not write the expected output ` +
          `to stdout (${exitCodeMsg})\n\n` +
          'Diff:\n' +
          '==================================================\n' +
          diff(expected, stdout) +
          '\n==================================================\n';
      }

      if (!result.pass) {
        result.message = message;
      }

      return result;
    },

    /**
     * Given the result of executing a command, tests whether the `expected`
     * output was *not* written to stdout. If `expected` is not given, tests
     * whether *no* output was written.
     *
     * @function not.toHaveWrittenToStdout
     * @param {{command: string, stdout: string, code: number}} actual
     *   The result of executing a command; see `helpers.exec`
     * @param {string} [expected] - The expected output
     * @return {{pass: boolean, message: ?string}}
     */
    negativeCompare({ command, stdout, code }, expected = null) {
      const result = {};
      const exitCodeMsg = `exit code ${code}`;
      let message;

      if (expected === null) {
        result.pass = util.equals(stdout, '');
        message = `Expected '${command}' not to write to stdout but it wrote ` +
                  `'${stdout}' (${exitCodeMsg})`;
      } else {
        result.pass = !util.equals(stdout, expected);
        message = `Expected '${command}' not to write '${expected}' to ` +
                  `stdout (${exitCodeMsg})`;
      }

      if (!result.pass) {
        result.message = message;
      }

      return result;
    }
  };
};
