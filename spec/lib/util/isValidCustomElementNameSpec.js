const isValidCustomElementName = require('../../../lib/util/isValidCustomElementName');

describe('isValidCustomElementName', () => {
  describe('returns true for valid name', () => {
    const validNames = [
      'foo-bar', 'foo-', 'foo-👻', 'foo-\u{f900}',
    ];

    for (const validName of validNames) {
      it(validName, () => {
        expect(isValidCustomElementName(validName)).toEqual(true);
      });
    }
  });

  describe('returns false for invalid name', () => {
    const invalidNames = [
      'foobar', '-foo-bar', 'foo bar', '9foo-bar',
      'fOo-BaR', 'font-face', 'dom-module',
    ];

    for (const invalidName of invalidNames) {
      it(invalidName, () => {
        expect(isValidCustomElementName(invalidName)).toEqual(false);
      });
    }
  });
});
