/**
 * A module that exports all available rules as an Array of
 * object of the form { 'rule-name': Function, ... }.
 * @module lib/rules
 * @type {Object.<string, Function>}
 */
const fs = require('fs');
const path = require('path');

// Get names of all files in this directory except this file
const rules = fs.readdirSync(__dirname).filter(
  filename => __filename !== path.join(__dirname, filename)
);

module.exports = rules.reduce((exps, filename) => {
  /* eslint-disable global-require, no-param-reassign */
  const ruleName = path.basename(filename, '.js');
  exps[ruleName] = require(`./${ruleName}`);
  return exps;
}, {});
