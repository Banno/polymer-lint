const getAttribute = require('util/getAttribute');

describe('getAttribute', () => {
  describe('given an empty array', () => {
    it('returns undefined', () => {
      const attrs = [];
      expect(getAttribute(attrs, 'foo')).toBe(undefined);
    });
  });

  describe('given an array of objects', () => {
    const attrs = [ { name: 'foo', value: 'a' }, { name: 'bar', value: 'b' } ];

    describe('having an object with a `name` property equal to the ' +
             'given name', () => {
      it('returns the object\'s `value` property', () => {
        expect(getAttribute(attrs, 'bar')).toEqual('b');
      });
    });

    describe('not having an object with a `name` property equal to the ' +
             'given name', () => {
      it('returns undefined', () => {
        expect(getAttribute(attrs, 'qux')).toBe(undefined);
      });
    });
  });
});
