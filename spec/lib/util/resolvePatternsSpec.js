const resolvePatterns = require('util/resolvePatterns');

describe('resolvePatterns', () => {
  let fs, glob;

  beforeEach(() => {
    fs = require('fs');
    // Paths that start with `/existing/` exist
    spyOn(fs, 'existsSync')
      .and.callFake(RegExp.prototype.test.bind(/^\/existing\/./));
    // Paths that end with `/directory` are directories
    spyOn(fs, 'statSync').and.callFake(path => ({
      isDirectory: () => /\/directory$/.test(path),
    }));

    glob = require('glob');
    spyOn(glob, 'Glob').and.returnValue([]);
  });

  it('calls `new glob.Glob` with the expected patterns', () => {
    const patterns = [ '/existing/file', '/foo/*.html', '/existing/directory' ];
    resolvePatterns({ _: patterns });

    expect(glob.Glob.calls.allArgs().map(([pattern]) => pattern))
      .toEqual([ '/existing/file', '/foo/*.html', '/existing/directory/**/*.html' ]);
  });

  it('returns unique results', () => {
    glob.Glob.and.returnValue({ found: [ '/foo/bar.html', '/foo/bar.html' ] });
    expect(resolvePatterns({ _: [ '/existing/file', '/existing/directory' ] }))
      .toEqual(['/foo/bar.html']);
  });
});
