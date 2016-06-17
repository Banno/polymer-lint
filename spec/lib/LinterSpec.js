const fs = require('fs');

describe('Linter', () => {
  let Linter, linter, dummyFileStream, dummyRule, dummyRules;

  const component = `
    <dom-module id="foo-module">
      <template>Hello</template>
      <script>
        Polymer({ is: "foo-module" });
      </script>
    </dom-module>
  `;

  const context = { filename: 'foo-file' };

  const dummyErrors = [
    { message: 'Dummy message 1', location: { line: 1, col: 1 } },
    { message: 'Dummy message 2', location: { line: 2, col: 2 } },
  ];

  beforeEach(() => {
    Linter = require('../../lib/Linter');
    dummyFileStream = helpers.streamFromString(component);
    spyOn(fs, 'createReadStream').and.returnValue(dummyFileStream);

    dummyRule = jasmine.createSpy('dummyRule');
    dummyRules = {
      'dummy-rule': dummyRule,
      'dummy-rule-2': dummyRule,
    };

    linter = new Linter(dummyRules);
  });

  describe('constructor', () => {
    it('accepts an object with rule names and functions', () => {
      expect(linter.enabledRules).toEqual(dummyRules);
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
         'by lintStream resolves with', (done) => {
        let resolve;

        dummyPromise = new Promise(_resolve => { resolve = _resolve; });
        lintStream.and.returnValue(dummyPromise);

        linter.lintFile(context.filename).then((...args) => {
          expect(...args).toEqual({ errors: dummyErrors, context: {} });
          done();
        });

        resolve({ errors: dummyErrors, context: {} });
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

      it('invokes each of the rules', (done) => {
        linter.lintStream(dummyFileStream, context).then(() => {
          const calls = dummyRule.calls;
          expect(calls.count()).toEqual(2);
          done();
        });
      });

      it('invokes the rules with the expected arguments', (done) => {
        linter.lintStream(dummyFileStream, context).then(() => {
          const args = dummyRule.calls.argsFor(0);
          expect(args[0]).toEqual(jasmine.objectContaining(context));
          expect(args[1].constructor.name).toEqual('SAXParser');
          expect(args[2]).toEqual(jasmine.any(Function));
          done();
        });
      });

      it('resolves the Promise with an Array of errors with added ' +
         '\'name\' property', (done) => {
        const ruleName = 'dummy-rule';

        dummyRule = (filename, parser, onError) => {
          for (const err of dummyErrors) {
            onError(err);
          }
        };

        linter = new Linter({ [ruleName]: dummyRule });

        const promise = linter.lintStream(dummyFileStream, context);
        const errsWithNames = dummyErrors.map(({ message, location }) =>
          ({ rule: ruleName, message, location }));

        promise.then(({ errors, context: actualContext }) => {
          expect(errors).toEqual(errsWithNames);
          expect(actualContext.filename).toEqual(context.filename);
          expect(actualContext.stack.constructor.name).toEqual('ScopedDirectiveStack');
          done();
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
