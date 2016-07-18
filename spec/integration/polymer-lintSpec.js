/* eslint-disable max-len */
function polymerLint(args, ...patterns) {
  const bin = helpers.relativePath(process.env.NODE_PATH, 'bin/polymer-lint.js');
  return helpers.exec(`${bin} ${args} ${patterns.join(' ')}`);
}

function itBehavesLike(args, filenames = []) {
  return {
    // Runs polymer-lint with the given command-line arguments and filenames and
    // asserts that it returns the given `exitCode` and `output` (on stdout).
    //
    // If `output` is not given, asserts that it writes nothing to stdout.
    returns(exitCode, output = null) {
      describe(args, () => {
        let result;

        beforeEach(() => {
          result = polymerLint(args, ...filenames);
        });

        it(`exits with status code ${exitCode}`,
          () => expect(result).toHaveExitedWith(exitCode));

        if (output === null) {
          it('has no output',
            () => expect(result).not.toHaveWrittenToStdout());
        } else {
          it('writes the expected output to stdout',
            () => expect(result).toHaveWrittenToStdout(output));
        }
      });
    },

    reportsErrors(expectedOutput) {
      this.returns(1, expectedOutput);
    },

    reportsNoErrors() {
      this.returns(0);
    },

    returnsHelp() {
      this.returns(0, helpers.unindent(`
        polymer-lint [options] file.html [file.html] [dir]

          --ext [String]       File extension(s) to lint - default: .html
          --rules [String]     Names of rules to enable; defaults to all rules
          --color, --no-color  Force enabling/disabling of color
          -h, --help           Show help
          -v, --version        Output the version number
      `));
    }
  };
}

// Convenience methods for writing testing polymer-lint output given specific
// arguments and filenames.
polymerLint.withArguments = (...args) => ({
  behavesLike: itBehavesLike(args),

  andFiles: (...filenames) => ({
    behavesLike: itBehavesLike(args,
      filenames.map(fn => helpers.relativePath(__dirname, fn))),
  }),

  andPatterns: (...patterns) => ({
    behavesLike: itBehavesLike(args,
      patterns.map(pattern => `'${helpers.relativePath(__dirname, pattern)}'`)),
  }),
});

describe('polymer-lint', () => {
  describe('with no arguments', () => {
    polymerLint.withArguments('')
      .behavesLike.returnsHelp();
  });

  describe('with --help argument', () => {
    polymerLint.withArguments('--help')
      .behavesLike.returnsHelp();
  });

  describe('with no filenames', () => {
    polymerLint.withArguments('--rules no-unused-imports')
      .andFiles()
      .behavesLike.returnsHelp();
  });

  describe('with multiple filenames', () => {
    polymerLint.withArguments('--rules no-missing-import')
      .andFiles('good-component.html', 'bad-component.html', 'bad-component-2.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
          16:7  Custom element 'missing-import' used but not imported  no-missing-import

        spec/integration/bad-component-2.html
          3:5  Custom element 'missing-import' used but not imported  no-missing-import

        ✖ 2 errors
      `));
  });

  describe('with a glob pattern', () => {
    polymerLint
      .withArguments('--rules no-missing-import')
      .andPatterns('*.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component-2.html
          3:5  Custom element 'missing-import' used but not imported  no-missing-import

        spec/integration/bad-component.html
          16:7  Custom element 'missing-import' used but not imported  no-missing-import

        spec/integration/element-card.html
           11:5   Custom element 'iron-flex' used but not imported  no-missing-import
          149:11  Custom element 'iron-icon' used but not imported  no-missing-import

        ✖ 4 errors
      `));
  });

  describe('with no rules specified', () => {
    polymerLint.withArguments('')
      .andFiles('bad-component.html', 'element-card.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
           2:1   Component 'unused-import' was imported but never used                                                   no-unused-import
           4:1   Expected 'bad-component.html' to declare component 'bad-component' but it declared 'b4d-c0mp0n3n7'      component-name-matches-filename
          16:7   Custom element 'missing-import' used but not imported                                                   no-missing-import
          22:13  Unexpected automatic binding in text: {{autoBindingsAreBad}}                                            no-auto-binding
          26:3   <style> tag outside of <template>                                                                       style-inside-template
          36:1   Expected 'bad-component.html' to declare component 'bad-component' but it declared 'another-component'  component-name-matches-filename
          36:1   More than one component defined: another-component                                                      one-component

        spec/integration/element-card.html
            1:1   Component 'maps-icons' was imported but never used           no-unused-import
            2:1   Component 'paper-material' was imported but never used       no-unused-import
            4:1   Component 'catalog-element' was imported but never used      no-unused-import
            5:1   Component 'catalog-package' was imported but never used      no-unused-import
            7:1   Component 'element-action-menu' was imported but never used  no-unused-import
           11:5   Custom element 'iron-flex' used but not imported             no-missing-import
          149:11  Custom element 'iron-icon' used but not imported             no-missing-import

        ✖ 14 errors
      `));
  });

  describe('with one rule specified', () => {
    polymerLint.withArguments('--rules component-name-matches-filename')
      .andFiles('bad-component.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
           4:1  Expected 'bad-component.html' to declare component 'bad-component' but it declared 'b4d-c0mp0n3n7'      component-name-matches-filename
          36:1  Expected 'bad-component.html' to declare component 'bad-component' but it declared 'another-component'  component-name-matches-filename

        ✖ 2 errors
      `));

    polymerLint.withArguments('--rules component-name-matches-filename')
      .andFiles('good-component.html')
      .behavesLike.reportsNoErrors();

    polymerLint.withArguments('--rules no-auto-binding')
      .andFiles('bad-component.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
          22:13  Unexpected automatic binding in text: {{autoBindingsAreBad}}  no-auto-binding

        ✖ 1 error
      `));

    polymerLint.withArguments('--rules no-auto-binding')
      .andFiles('good-component.html')
      .behavesLike.reportsNoErrors();

    polymerLint.withArguments('--rules no-missing-import')
      .andFiles('bad-component.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
          16:7  Custom element 'missing-import' used but not imported  no-missing-import

        ✖ 1 error
      `));

    polymerLint.withArguments('--rules no-missing-import')
      .andFiles('good-component.html')
      .behavesLike.reportsNoErrors();

    polymerLint.withArguments('--rules no-unused-import')
      .andFiles('bad-component.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
          2:1  Component 'unused-import' was imported but never used  no-unused-import

        ✖ 1 error
      `));

    polymerLint.withArguments('--rules no-unused-import')
      .andFiles('good-component.html')
      .behavesLike.reportsNoErrors();

    polymerLint.withArguments('--rules one-component')
      .andFiles('bad-component.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
          36:1  More than one component defined: another-component  one-component

        ✖ 1 error
      `));

    polymerLint.withArguments('--rules one-component')
      .andFiles('good-component.html')
      .behavesLike.reportsNoErrors();

    polymerLint.withArguments('--rules style-inside-template')
      .andFiles('bad-component.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
          26:3  <style> tag outside of <template>  style-inside-template

        ✖ 1 error
      `));

    polymerLint.withArguments('--rules style-inside-template')
      .andFiles('good-component.html')
      .behavesLike.reportsNoErrors();
  });

  describe('with multiple rules specified', () => {
    polymerLint
      .withArguments('--rules one-component,no-auto-binding,no-missing-import')
      .andFiles('bad-component.html')
      .behavesLike.reportsErrors(helpers.unindent(`
        spec/integration/bad-component.html
          16:7   Custom element 'missing-import' used but not imported         no-missing-import
          22:13  Unexpected automatic binding in text: {{autoBindingsAreBad}}  no-auto-binding
          36:1   More than one component defined: another-component            one-component

        ✖ 3 errors
      `));

    polymerLint
      .withArguments('--rules one-component,no-auto-binding,no-missing-import')
      .andFiles('good-component.html')
      .behavesLike.reportsNoErrors();
  });
});
