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
gulp-polymer-lint has two parts, a linter and a reporter. The former reads adds
a `polymerLint` property to each File object with the lint results and the
latter reads and prints them.

gulp-polymer-lint comes with two reporters: `polymerLint.report()` and
`polymerLint.reportAtEnd()`. The former prints results as each file is
linted whereas the latter does only after all files have been linted.

### Example

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

### Linter

By default `polymerLint()` lints files with all available rules. To use specific
rules, pass it an options object whose `rules` property is an array of
rule names.

```javascript
gulp.task('default', () => {
  return gulp.src('./src/components/*.html')
    .pipe(polymerLint({ rules: ['no-missing-import', 'no-unused-import'] }))
    // ...
});
```

### Reporters

Both `polyerLint.report()` and `polymerLint.reportAtEnd()` can be passed an
options object with any of the following properties:

  * `out` - An object with a `write` function. By default `gulp-util.log` is used.
  * `color` - A boolean specifying whether output should be styled. Defaults
    to [`chalk.supportsColor`].

#### Example

```javascript
gulp.task('default', () => {
  return gulp.src('./src/components/*.html')
    .pipe(polymerLint())
    .pipe(polymerLint.reportAtEnd({ color: false })
    // ...
});
```
