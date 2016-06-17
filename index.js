const fs = require('fs');
const path = require('path');

const Linter = require('./lib/Linter');
const rules = require('./lib/rules');

const examplesPath = path.join(__dirname, './example');

const examples = fs.readdirSync(examplesPath)
  .map((filename) => path.join(examplesPath, filename));

const ConsoleReporter = require('./lib/reporters/ConsoleReporter');

Linter.lintFiles(examples, rules)
  .then(res => {
    const reporter = new ConsoleReporter;
    reporter.report(res);
  })
  .catch((err) => {
    console.log('ERROR!', err);
  });
