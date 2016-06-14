const rules = require('../../lib/rules');
const SAXParser = require('../../lib/SAXParser');

describe('rules', () => {
  it('exports an object', () => {
    expect(rules).toEqual(jasmine.any(Object));
  });

  for (const ruleName of Object.keys(rules)) {
    describe(ruleName, () => {
      let rule;

      beforeEach(() => {
        rule = rules[ruleName];
      });

      it('is a function', () => {
        expect(rule).toEqual(jasmine.any(Function));
      });

      it('accepts the expected arguments', () => {
        const args = [ 'foo.html', new SAXParser({}), () => {} ];
        expect(() => rule(...args)).not.toThrow();
      });
    });
  }
});
