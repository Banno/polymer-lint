/**
 * Options
 * @module lib/Options
 */

module.exports = require('optionator')({
  prepend: 'polymer-lint [options] file.html [file.html] [dir]',
  options: [
    { option: 'ext',
      type: '[String]',
      default: '.html',
      description: 'File extension to search for',
    },
    { option: 'rule',
      type: '[String]',
      description: 'Names of rules to enable; defaults to all rules'
    },
    { option: 'help',
      alias: 'h',
      type: 'Boolean',
      description: 'Show help',
    },
    { option: 'version',
      alias: 'v',
      type: 'Boolean',
      description: 'Output the version number',
    },
  ]
});
