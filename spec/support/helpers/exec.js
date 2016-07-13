const { exec: shellExec } = require('shelljs');

/**
 * Silently executes the command using `shelljs.exec` and adds the command
 * itself to the result as the `command` property before returning it.
 *
 * If the `DEBUG` environment variable is set, both the command and its output
 * will be printed.
 *
 * @param {string} cmd - The command to execute
 * @return {object} - The result of executing the command
 * @see https://github.com/shelljs/shelljs/blob/master/README.md#execcommand--options--callback}
 */
module.exports = function exec(cmd) {
  if (process.env.DEBUG) {
    console.log('helpers.exec:', cmd);
  }

  const result = shellExec(cmd, { silent: !process.env.DEBUG });
  result.command = cmd;
  return result;
};
