gulp-polymer-lint
=================

Installation
------------
At present gulp-polymer-lint ships with [polymer-lint].

```sh
$ npm install polymer-lint
```

[polymer-lint]: https://github.com/Banno/polymer-lint

Usage
-----
gulp-polymer-lint has two parts, the linter (`polymerLint()`) and the reporter
(`polymerLint.report()`). The former reads adds a `polymerLint` property to each
File object with the lint results and the latter reads and prints them with
[ConsoleReporter](../reporters/ConsoleReporter.js).

```javascript
const gulp = require('gulp');
const polymerLint = require('polymer-lint/gulp');

gulp.task('default', () => {
  return gulp.src('./src/components/*.html')
    .pipe(polymerLint())
    .pipe(polymerLint.report())
    .pipe(gulp.dest('./dist/'));
});
```

Options
-------
By default gulp-polymer-lint runs lints files with all available rules. To use
specific rules, an array of rule names can be passed to `polymerLint` as the
`rules` option:

```javascript
gulp.task('default', () => {
  return gulp.src('./src/components/*.html')
    .pipe(polymerLint({ rules: ['no-missing-import', 'no-unused-import'] }))
    .pipe(polymerLint.report())
    .pipe(gulp.dest('./dist/'));
});
```
