#!/usr/bin/env node

const CLI = require('../CLI');

function handleError(err) {
  console.log('Oops! Something went wrong.\n', err);
  process.exit(1);
}

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

CLI.execute(process.argv).then(exitCode => {
  process.exitCode = exitCode;
});
