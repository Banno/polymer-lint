const fs = require('fs');
const path = require('path');

const Linter = require('./lib/Linter');

const examplesPath = path.join(__dirname, './example');

const examples = fs.readdirSync(examplesPath)
  .map((filename) => path.join(examplesPath, filename));

const res = Linter.lintFiles(examples).then((errors) => {
  console.log('done');
  console.log(errors);
}).catch((err) => {
  console.log('ERROR!', err);
});
