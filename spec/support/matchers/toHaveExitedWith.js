module.exports = function toHaveExitedWith(util, customEqualityTesters) {
  return {
    /**
     * Given the result of executing a command, tests whether it exited with the
     * given exit code.
     *
     * @function toHaveExitedWith
     * @param {{command: string, code: number}} actual
     *   The result of executing a command; see `helpers.exec`
     * @param {number} expectedCode - The expected exit code
     * @return {{pass: boolean, message: ?string}}
     */
    compare({ command, code }, expectedCode) {
      const result = { pass: util.equals(code, expectedCode) };

      if (result.pass) {
        result.message = `Expected command '${command}' not to have exited ` +
          `with code ${code}`;
      } else {
        result.message = `Expected command '${command}' to have exited ` +
          `with ${expectedCode} but its exit code was ${code}`;
      }

      return result;
    }
  };
};
