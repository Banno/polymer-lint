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

  const metadata = { filename: 'foo-file' };

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

        // args[0] = stream
        expect(args[0]).toEqual(dummyFileStream);

        // args[1] = metadata
        expect(args[1]).toEqual({ filename });
      });

      it('returns the Promise returned by lintStream', () => {
        const res = linter.lintFile('baz.html');
        expect(res).toEqual(dummyPromise);
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
        linter.lintStream(dummyFileStream, metadata).then(() => {
          const calls = dummyRule.calls;
          expect(calls.count()).toEqual(2);
          done();
        });
      });

      it('invokes the rules with the expected arguments', (done) => {
        linter.lintStream(dummyFileStream, metadata).then(() => {
          const args = dummyRule.calls.argsFor(0);
          expect(args[0]).toEqual(metadata.filename);
          expect(args[1].constructor.name).toEqual('SAXParser');
          expect(args[2]).toEqual(jasmine.any(Function));
          done();
        });
      });

      it('resolves the Promise with an Array of errors with the rule ' +
         'name prepended', (done) => {
        const ruleName = 'dummy-rule';

        const dummyErrors = [
          [ 'Dummy message 1', { foo: 1 } ],
          [ 'Dummy message 2', { foo: 2 } ],
        ];

        dummyRule = (filename, parser, onError) => {
          for(const err of dummyErrors) {
            onError(...err);
          }
        };

        linter = new Linter({ [ruleName]: dummyRule });

        const promise = linter.lintStream(dummyFileStream, metadata);
        const errsPrepended = dummyErrors.map((args) => [ ruleName, ...args ]);

        expect(promise).toResolveWith(errsPrepended, done);
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
