const { PassThrough } = require('stream');
const filterErrors = require('util/filterErrors');
const Linter = require('Linter');

// This is a rule that reports an error for every startTag, with the ruleName
// equal to the startTag's name.
function noisyRule(context, parser, onError) {
  parser.on('startTag', (name, attrs, selfClosing, location) => {
    onError({
      rule: name,
      message: `You broke rule ${name}`,
      location,
    });
  });
}

describe('filterErrors', () => {
  const obj = jasmine.objectContaining;

  let linter;

  beforeEach(() => {
    linter = new Linter({ 'noisy-rule': noisyRule });
  });

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
    let stream, lintResult;

    beforeEach((done) => {
      stream = new PassThrough();
      stream.end(doc);
      linter.lintStream(stream).then(result => {
        lintResult = result;
        done();
      });
    });

    it('it returns the expected errors', () => {
      const errors = filterErrors(lintResult.errors, lintResult.context.stack);

      expect(errors).toEqual([
        obj({ rule: 'ln-1-err', location: obj({ line: 1, col: 1 }) }),
        obj({ rule: 'ln-2-err', location: obj({ line: 2, col: 3 }) }),
        obj({ rule: 'ln-3-err', location: obj({ line: 3, col: 5 }) }),
        obj({ rule: 'ln-12-err', location: obj({ line: 12, col: 1 }) }),
      ]);
    });
  });
});
