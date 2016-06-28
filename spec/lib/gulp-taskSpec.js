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
        jasmine.objectContaining({ rule: 'no-missing-import' }),
        jasmine.objectContaining({ rule: 'no-unused-import' })
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
      stream.on('finish', () => {
        const expected = [ `${filename}\n`,
          jasmine.stringMatching(/no-missing-import\n$/),
          jasmine.stringMatching(/no-unused-import\n$/),
        ];

        for (const line of expected) {
          expect(write).toHaveBeenCalledWith(line);
        }

        done();
      });

      stream.write(file);
      stream.end();
    });
  });
});
