const fs = require('fs');

describe('Linter', () => {
  let Linter, linter, dummyFileStream, rule, rules, errors;

  const component = `
    <dom-module id="foo-module">
      <template>Hello</template>
      <script>
        Polymer({ is: "foo-module" });
      </script>
    </dom-module>
  `;

  const context = { filename: 'foo-file' };

  beforeEach(() => {
    errors = [
      { message: 'Dummy message 1', location: { line: 1, col: 1 } },
      { message: 'Dummy message 2', location: { line: 2, col: 2 } },
    ];

    Linter = require('../../lib/Linter');
    dummyFileStream = helpers.streamFromString(component);
    spyOn(fs, 'createReadStream').and.returnValue(dummyFileStream);

    rule = jasmine.createSpy('rule');
    rules = {
      'dummy-rule': rule,
      'dummy-rule-2': rule,
    };

    linter = new Linter(rules);
  });

  describe('constructor', () => {
    it('accepts an object with rule names and functions', () => {
      expect(linter.enabledRules).toEqual(rules);
    });
  });

  describe('instance method', () => {
    describe('lintFile', () => {
      let lintStream, dummyPromise;

      beforeEach(() => {
        dummyPromise = new Promise(() => {});

        lintStream = spyOn(linter, 'lintStream')
          .and.returnValue(dummyPromise);
      });

      it('calls lintStream with the expected arguments', () => {
        const filename = 'qux.html';

        linter.lintFile(filename);
        expect(lintStream).toHaveBeenCalled();

        const args = lintStream.calls.argsFor(0);

        expect(args[0]).toEqual(dummyFileStream);
        expect(args[1]).toEqual({ filename });
      });

      it('returns a Promise that is resolved with value the Promise returned ' +
         'by lintStream resolves with', done => {
        let resolve;

        dummyPromise = new Promise(_resolve => {
          resolve = _resolve;
        });
        lintStream.and.returnValue(dummyPromise);

        linter.lintFile(context.filename).then((...args) => {
          expect(...args).toEqual({ errors, context: {} });
          done();
        });

        resolve({ errors, context: {} });
      });
    });

    describe('lintFiles', () => {
      const filenames = [ 'foo-bar.html', 'baz-qux.html' ];
      let lintFile, dummyPromise;

      beforeEach(() => {
        dummyPromise = new Promise(() => {});
        lintFile = spyOn(linter, 'lintFile').and.returnValue(dummyPromise);
      });

      it('calls lintFile with each filename', () => {
        linter.lintFiles(filenames);

        for (const filename of filenames) {
          expect(lintFile).toHaveBeenCalledWith(filename);
        }
      });

      it('returns a Promise', () => {
        expect(linter.lintFiles([])).toEqual(jasmine.any(Promise));
      });
    });

    describe('lintStream', () => {
      it('returns a Promise', () => {
        const res = linter.lintStream(dummyFileStream);
        expect(res).toEqual(jasmine.any(Promise));
      });

      it('invokes each of the rules', done => {
        linter.lintStream(dummyFileStream, context).then(() => {
          const calls = rule.calls;
          expect(calls.count()).toEqual(2);
          done();
        });
      });

      it('invokes the rules with the expected arguments', done => {
        linter.lintStream(dummyFileStream, context).then(() => {
          const args = rule.calls.argsFor(0);
          expect(args[0]).toEqual(jasmine.objectContaining(context));
          expect(args[1].constructor.name).toEqual('SAXParser');
          expect(args[2]).toEqual(jasmine.any(Function));
          done();
        });
      });

      describe('resolves the returned Promise', () => {
        const ruleName = 'dummy-rule';

        it('with an Array of errors with added \'name\' property', done => {
          rule = (filename, parser, onError) => {
            for (const err of errors) {
              onError(err);
            }
          };

          linter = new Linter({ [ruleName]: rule });

          const promise = linter.lintStream(dummyFileStream, context);
          const errsWithNames = errors.map(({ message, location }) =>
            ({ rule: ruleName, message, location }));

          promise.then(({ errors, context: actualContext }) => {
            expect(errors).toEqual(errsWithNames);
            expect(actualContext.filename).toEqual(context.filename);
            expect(actualContext.stack.constructor.name).toEqual('ScopedDirectiveStack');
            done();
          });
        });

        it('with an Array of errors sorted by source location', done => {
          const errorsOutOfOrder = errors.slice().reverse();

          rule = (filename, parser, onError) => {
            for (const err of errorsOutOfOrder) {
              onError(err);
            }
          };

          linter = new Linter({ [ruleName]: rule });

          const promise = linter.lintStream(dummyFileStream, context);
          const expectedLocations = errors.map(({ location }) => location);

          promise.then(({ errors: actualErrors }) => {
            expect(actualErrors.map(({ location }) => location))
              .toEqual(expectedLocations);
            done();
          });
        });
      });
    });
  });

  describe('static method lintFiles', () => {
    it('calls lintFiles on an instance of Linter', () => {
      const filenames = ['foo.html'];
      const lintFiles = spyOn(Linter.prototype, 'lintFiles');

      Linter.lintFiles(filenames, {});
      expect(lintFiles).toHaveBeenCalledWith(filenames);
    });
  });
});
