const { File } = require('gulp-util');
const polymerLint = require('gulp-task');

describe('gulp-polymer-lint', () => {
  let file, stream, onData;

  const filename = 'foo-component.html';

  const component = new Buffer(`
    <link rel="import" href="bar-component.html"/>
    <dom-module id="foo-component">
      <template>
        <baz-component/>
      </template>
    </dom-module>
  `);

  beforeEach(() => {
    onData = jasmine.createSpy('onData');
    file = new File({ path: filename, contents: component });
    stream = polymerLint()
      .on('data', onData)
      .on('error', fail);
  });

  it('records errors on the File\'s `polymerLint` property', done => {
    stream.on('end', () => {
      expect(onData).toHaveBeenCalled();
      const [ { polymerLint } ] = onData.calls.argsFor(0);

      expect(polymerLint.errors).toEqual([
        jasmine.objectContaining({ rule: 'no-unused-import' }),
        jasmine.objectContaining({ rule: 'no-missing-import' }),
      ]);

      expect(polymerLint.context.filename).toEqual(filename);

      done();
    });

    stream.write(file);
    stream.end();
  });

  describe('given the `rules` option', () => {
    const rules = [ 'no-unused-import' ];

    beforeEach(() => {
      stream = polymerLint({ rules })
        .on('data', onData)
        .on('error', fail);
    });

    it('uses only those rules', done => {
      stream.on('end', () => {
        expect(onData).toHaveBeenCalled();
        const [ { polymerLint } ] = onData.calls.argsFor(0);

        expect(polymerLint.errors).toEqual([
          jasmine.objectContaining({ rule: rules[0] }),
        ]);

        done();
      });

      stream.write(file);
      stream.end();
    });
  });

  describe('report', () => {
    let write, options;

    beforeEach(() => {
      write = jasmine.createSpy('write');
      options = { out: { write }, color: false };
      stream.pipe(
        polymerLint.report(options).on('error', fail)
      );
    });

    it('outputs the errors using ConsoleReporter', done => {
      const expected = [
        `^${filename}\n$`,
        /no-missing-import\n$/,
        /no-unused-import\n$/,
      ];

      stream.on('finish', () => {
        for (const line of expected) {
          expect(write).toHaveBeenCalledWith(jasmine.stringMatching(line));
        }
        done();
      });

      stream.write(file);
      stream.end();
    });
  });

  describe('reportAtEnd', () => {
    let write, options, file2;

    const filename2 = 'baz-component.html';

    const component2 = new Buffer(`
      <dom-module id="baz-component">
        <template><qux-component/></template>
      </dom-module>
    `);

    beforeEach(() => {
      file2 = new File({ path: filename2, contents: component2 });
      write = jasmine.createSpy('write');
      options = { out: { write }, color: false };
      stream.pipe(
        polymerLint.reportAtEnd(options).on('error', fail)
      );
    });

    it('outputs all of the errors at the end', done => {
      const expected = [
        `^${filename}\n$`,
        /no-missing-import\n$/,
        /no-unused-import\n$/,
        '\n',
        `^${filename2}\n$`,
        /no-missing-import\n/,
        '\n',
        '^✖ 3 errors\n$',
      ];

      stream.on('end', () => {
        for (const line of expected) {
          expect(write).toHaveBeenCalledWith(jasmine.stringMatching(line));
        }
        done();
      });

      stream.write(file);
      stream.write(file2);
      stream.end();
    });
  });
});
