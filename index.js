const fs = require('fs');
const path = require('path');

const Linter = require('./lib/Linter');
const rules = require('./lib/rules');

const examplesPath = path.join(__dirname, './example');

const examples = fs.readdirSync(examplesPath)
  .map((filename) => path.join(examplesPath, filename));

const inspect = require('util').inspect;

Linter.lintFiles(examples, rules)
  .then((res) => {
    console.log('done');

    for (const { errors, context } of res) {
      console.log(context.filename);

      if (errors.length) {
        for (const { rule, message } of errors) {
          console.log(`- ${rule} - ${message}`);
        }
      } else {
        console.log('- No errors');
      }
      console.log();
    }
  })
  .catch((err) => {
    console.log('ERROR!', err);
  });
