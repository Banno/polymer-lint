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
      description: 'File extension(s) to lint',
    },
    { option: 'rules',
      type: '[String]',
      description: 'Names of rules to enable; defaults to all rules',
    },
    { option: 'color',
      alias: 'no-color',
      type: 'Boolean',
      description: 'Force enabling/disabling of color',
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
