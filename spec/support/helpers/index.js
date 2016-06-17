const path = require('path');
const readdirSync = require('fs').readdirSync;

module.exports = readdirSync(__dirname).reduce((helpers, filename) => {
  const filepath = path.join(__dirname, filename);

  if (filepath === __filename || path.extname(filename) !== '.js') {
    return helpers;
  }

  const helperName = path.basename(filename, '.js');
  const helper = require(filepath);

  return Object.assign({}, helpers, { [helperName]: helper });
}, {});
