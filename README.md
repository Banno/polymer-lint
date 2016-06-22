polymer-lint
============

A linter for Polymer components

Table of Contents
-----------------
  - [Installation](#installation)
  - [Usage](#usage)
    - [Command line](#command-line)
    - [Rules](#rules)
      - [component-name-matches-filename](#component-name-matches-filename)
      - [no-missing-import](#no-missing-import)
      - [one-component](#one-component)
      - [style-inside-template](#style-inside-template)
    - [Linter directives](#linter-directives)
    - [Node.js API](#nodejs-api)
  - [Configuration](#configuration)
  - [Development](#development)
  - [Notes](#notes)
  - [TODO](#todo)

Installation
------------

```sh
$ npm install -g 'git+ssh://git@github.com:Banno/polymer-lint.git'
```

Usage
-----

### Command line

```text
polymer-lint [options] file.html [file.html] [dir]

  --ext [String]       File extension(s) to lint - default: .html
  --rules [String]     Names of rules to enable; defaults to all rules
  --color, --no-color  Force enabling/disabling of color
  -h, --help           Show help
  -v, --version        Output the version number
```

### Rules

#### component-name-matches-filename

Ensures that the component defined in a file matches its filename.

###### OK

```html
<!-- file: foo-component.html -->
<dom-module id="foo-component">...</dom-module>
```

###### Error

```html
<!-- file: foo-component.html -->
<dom-module id="bar-component">...</dom-module>
```

#### no-missing-import

Ensures that all components that are used have been imported.

**Note:** This rule does not analyze imported files; it only analyzes `<link/>`
tags and assumes that e.g. `<link rel="import" href="foo-component.html"/>` will
define `foo-component`.

###### OK

```html
<link rel="import" href="foo-component.html"/>
<dom-module id="my-component">
  <template>
    <foo-component/>
  </template>
</dom-module>
```

###### Error

```html
<dom-module id="my-component">
  <template>
    <foo-component/>
  </template>
</dom-module>
```

#### one-component

Ensures that a file defines no more than one component.

###### OK

```html
<dom-module id="my-component">...</dom-module>
```


###### Error

```html
<dom-module id="my-component">...</dom-module>
<dom-module id="another-component">...</dom-module>
```

#### style-inside-template

Ensures that no `<style>` tags appear outside of `<template>` tags.

###### OK

```html
<dom-module id="my-component">
  <template>
    <style>/* ... */<style>
    ...
  </template>
</dom-module>
```

###### Error

```html
<dom-module id="my-component">
  <style>/* ... */</style>
  <template>...</template>
</dom-module>
```

### Linter directives

Component code can give instructions to the Linter via directives, which
are HTML comments of the form:

```text
<!-- bplint-directive-name arg1, arg2, ... -->
```

#### bplint-disable

The `bplint-disable` directive tells the linter to ignore errors
reported by the given rules from this point on, within the current
scope. For example:

```html
<dom-module id="my-component">
  <article>
    <mystery-component-1/>
    <!-- bplint-disable no-missing-import -->
    <mystery-component-2/>
  </article>
  <mystery-component-3/>
</dom-module>
```

None of the three `<mystery-component-*/>` elements has been imported,
but the `bplint-disable` directive ensures that errors will only be
reported for `<mystery-component-1/>` (because it's before the
directive) and `<mystery-component-3/>` (because it's outside the scope
in which the `bplint-disable` directive was used.

The `polymer-lint` output for the above would be:

```text
$ polymer-lint my-component.html
my-component.html
  3:5 Custom element <mystery-component-1> used but not imported no-missing-import
  7:3 Custom element <mystery-component-3> used but not imported no-missing-import

✖ 2 errors
```

### Node.js API

API documentation can be generated with [JSDoc](http://usejsdoc.org/):

```sh
$ npm install -g jsdoc
$ jsdoc -c ./jsdoc.json
$ open doc/index.html
```

Configuration
-------------
At present configuration is only possible via [command-line arguments](#command-line)
(see [Usage](#usage)) or the [Node.js API](#api-documentation).

Development
-----------

```sh
$ git clone git@github.com:Banno/polymer-lint.git
$ cd polymer-lint
$ npm install
```

### Run with examples

```sh
$ node bin/polymer-lint.js example
```

### Jasmine specs

```sh
$ npm test
```

### ESLint

```sh
$ npm run lint
```

Notes
-----
### Limitations
polymer-lint currently has the following limitations:

  * Only HTML code is linted. JavaScript code is not analyzed.
  * The `polymer-lint` command cannot read from STDIN.
  * The `polymer-lint` command can only be configured via command line
    arguments; it cannot read from a configuration file.

TODO
----
  * Windows support
  * Read configuration from file
  * Gulp, Grunt tasks
  * Put API docs online
  * Editor integrations
