const componentNameFromPath = require('../../../lib/util/componentNameFromPath');

describe('componentNameFromPath', () => {
  describe('when the path includes a valid component name', () => {
    it('returns the component name', () => {
      const paths = [
        '/foo/bar/baz-component.html',
        '/foo/bar/baz-component',
        'baz-component.html',
        'baz-component',
      ];

      for (const path of paths) {
        expect(componentNameFromPath(path)).toEqual('baz-component');
      }
    });
  });

  describe('when the path doesn\'t include a valid component name', () => {
    it('returns null', () => {
      const paths = [
        '/foo/bar/baz.html',
        '/foo/bar/baz',
        'baz.html',
        'baz',
        '/foo/bar/font-face.html',
        'font-face.html',
        'font-face',
        '',
        undefined,
      ];

      for (const path of paths) {
        expect(componentNameFromPath(path)).toBe(null);
      }
    });
  });
});
