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

```javascript
const gulp = require('gulp');
const polymerLint = require('polymer-lint/gulp');

gulp.task('default', () => {
  return gulp.src('./src/components/*.html')
    .pipe(polymerLint())
    .pipe(gulp.dest('./dist/'));
});
```

Options
-------
By default gulp-polymer-lint runs lints files with all available rules. To use
specific rules, an array of rule names can be passed as the `rules` option:

```javascript
gulp.task('default', () => {
  return gulp.src('./src/components/*.html')
    .pipe(polymerLint({ rules: ['no-missing-import', 'no-unused-import'] }))
    .pipe(gulp.dest('./dist/'));
});
```
