/**
 * A module that exports all available linters as an Array of
 * object of the form { 'linter-name': Function, ... }.
 * @module lib/linters
 * @type {Object.<string, Function>}
 */
const fs = require('fs');
const path = require('path');

// Get names of all files in this directory except this file
const linters = fs.readdirSync(__dirname).filter((filename) => {
  return __filename !== path.join(__dirname, filename);
});

module.exports = linters.reduce((exports, filename) => {
  const linterName = path.basename(filename, '.js');
  exports[linterName] = require(`./${linterName}`);
  return exports;
}, {});
