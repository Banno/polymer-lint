'use strict';

/**
 * Utility functions
 * @module lib/util
 */
const path = require('path');
const fs = require('fs');

// Get names of all files in this directory except this file
const utils = fs.readdirSync(__dirname).filter(filename => __filename !== path.join(__dirname, filename));

module.exports = utils.reduce((exps, filename) => {
  /* eslint-disable global-require, no-param-reassign */
  const name = path.basename(filename, '.js');
  exps[name] = require(`./${ name }`);
  return exps;
}, {});