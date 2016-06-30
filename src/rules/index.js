/**
 * @file A module that exports all available rules as an Array of object of the
 *   form `{ 'rule-name': Function, ... }`.
 * @module lib/rules
 * @see Rules
 */

/**
 * @typedef {Function} Rule
 * @global
 * @description A function that registers event listeners on the given `parser`
 *   and invokes `onError` to report issues with the parsed data.
 * @param {Linter.LintStreamContext} context
 * @param {SAXParser} parser
 * @param {OnErrorCallback} onError
 */

/**
 * @typedef {Object<string,Rule>} Rules
 * @global
 * @description An object of the form `{ 'rule-name': Function, ... }`.
 */
module.exports = require('../util/exportDir')(__dirname);
