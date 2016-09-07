const { PassThrough } = require('stream');
const Linter = require('Linter');
const getAttribute = require('util/getAttribute');
const filterErrors = require('util/filterErrors');

describe('filterErrors', () => {
  // This is a rule that reports an error for every startTag, with the ruleName
  // equal to the startTag's name.
  function noisyRule(context, parser, onError) {
    parser.on('startTag', (name, attrs, selfClosing, location) => {
      onError({
        rule: name,
        message: getAttribute(attrs, 'message') || '',
        location,
      });
    });
  }

  function lint(doc, done) {
    const linter = new Linter({ 'noisy-rule': noisyRule });
    const stream = new PassThrough();

    stream.end(doc);
    return linter.lintStream(stream);
  }

  const obj = jasmine.objectContaining;

  describe('bplint-disable', () => {
    const doc = helpers.unindent(`
      <ln-1-err>
        <ln-2-err>
          <ln-3-err></ln-3-err>
          <!-- bplint-disable ln-5-no-err, ln-6-no-err -->
          <ln-5-no-err>
            <ln-6-no-err></ln-6-no-err>
          </ln-5-no-err>
        </ln-2-err>
      </ln-1-err>
      <!-- bplint-disable ln-11-no-err -->
      <ln-11-no-err></ln-11-no-err>
      <ln-12-err></ln=12-err>
    `);

    it('returns the expected errors', done => {
      lint(doc).then(({ errors, context }) => {
        const result = filterErrors(errors, context.stack);

        expect(result).toEqual([
          obj({ rule: 'ln-1-err', location: obj({ line: 1, col: 1 }) }),
          obj({ rule: 'ln-2-err', location: obj({ line: 2, col: 3 }) }),
          obj({ rule: 'ln-3-err', location: obj({ line: 3, col: 5 }) }),
          obj({ rule: 'ln-12-err', location: obj({ line: 12, col: 1 }) }),
        ]);

        done();
      });
    });
  });

  describe('bplint-enable', () => {
    describe('simple test', () => {
      const doc = helpers.unindent(`
        <!-- bplint-enable x-elm -->
        <x-elm message="line 2 error"></x-elm>
        <!-- bplint-disable x-elm -->
        <x-elm message="no error"></x-elm>
      `);

      it('returns the expected errors', done => {
        lint(doc).then(({ errors, context }) => {
          const result = filterErrors(errors, context.stack);

          expect(result).toEqual([
            obj({ rule: 'x-elm', message: 'line 2 error', location: obj({ line: 2, col: 1 }) }),
          ]);

          done();
        });
      });
    });

    describe('complex test', () => {
      const doc = helpers.unindent(`
        <!-- bplint-disable x-elm, y-elm -->
        <x-elm message="no error"></x-elm>
        <!-- bplint-enable x-elm -->
        <x-elm message="line 4 error"></x-elm>
        <y-elm message="no error">
          <x-elm message="line 6 error"></x-elm>
          <!-- bplint-enable y-elm -->
          <y-elm message="line 8 error"></y-elm>
          <!-- bplint-disable y-elm -->
          <y-elm message="no error"></y-elm>
        </y-elm>
        <y-elm message="no error"></y-elm>
      `);

      it('returns the expected errors', done => {
        lint(doc).then(({ errors, context }) => {
          const result = filterErrors(errors, context.stack);

          expect(result).toEqual([
            obj({ rule: 'x-elm', message: 'line 4 error', location: obj({ line: 4, col: 1 }) }),
            obj({ rule: 'x-elm', message: 'line 6 error', location: obj({ line: 6, col: 3 }) }),
            obj({ rule: 'y-elm', message: 'line 8 error', location: obj({ line: 8, col: 3 }) }),
          ]);

          done();
        });
      });
    });
  });
});
