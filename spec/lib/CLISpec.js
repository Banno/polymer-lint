const CLI = require('CLI');

describe('CLI', () => {
  function args(...arr) {
    return [ 'node', 'polymer-lint.js', ...arr ];
  }

  let Options, Linter;
  const filenames = ['./example/missing-import.html', './example/unused-import.html'];

  beforeEach(() => {
    Options = require('Options');
    spyOn(console, 'log');
  });

  describe('execute', () => {
    describe('with no arguments', () => {
      it('displays help', () => {
        spyOn(Options, 'generateHelp').and.returnValue('Help');
        CLI.execute(args('--help'));
        expect(Options.generateHelp).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('Help');
      });
    });

    describe('with filename arguments', () => {
      let mockPromise;

      beforeEach(() => {
        mockPromise = jasmine.createSpyObj('promise', ['then']);
        Linter = require('Linter');
        spyOn(Linter, 'lintFiles').and.returnValue(mockPromise);
      });

      it('calls Linter.lintFiles with the given filenames', () => {
        CLI.execute(args(...filenames));

        expect(Linter.lintFiles).toHaveBeenCalledWith(
          filenames, jasmine.objectContaining({ _: filenames }));
        expect(mockPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
      });

      describe('and --rules', () => {
        it('calls Linter.lintFiles with the expected `rules` option', () => {
          const ruleNames = ['no-missing-import', 'no-unused-import'];
          CLI.execute(args('--rules', ruleNames.join(','), ...filenames));

          expect(Linter.lintFiles).toHaveBeenCalledTimes(1);

          const [ actualFilenames, { rules: actualRules } ] = Linter.lintFiles.calls.argsFor(0);
          expect(actualFilenames).toEqual(filenames);
          expect(actualRules).toEqual(ruleNames);
          expect(mockPromise.then).toHaveBeenCalledWith(jasmine.any(Function));
        });
      });
    });

    describe('with --help', () => {
      it('displays help', () => {
        spyOn(Options, 'generateHelp').and.returnValue('Help');
        CLI.execute(args('--help'));
        expect(Options.generateHelp).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('Help');
      });
    });

    describe('with --version', () => {
      it('prints the version number', () => {
        CLI.execute(args('--version'));
        const expectedVersion = `v${require('../../package.json').version}`;
        expect(console.log).toHaveBeenCalledWith(expectedVersion);
      });
    });

    describe('with --color', () => {});
    describe('with --no-color', () => {});
  });
});
