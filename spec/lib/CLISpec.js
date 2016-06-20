const CLI = require('../../lib/CLI');

describe('CLI', () => {
  let Options;

  beforeEach(() => {
    Options = require('../../lib/Options');
    spyOn(console, 'log');
  });

  describe('execute', () => {
    describe('with no arguments', () => {
      it('displays help', () => {
        spyOn(Options, 'generateHelp').and.returnValue('Help');
        CLI.execute({ help: true });
        expect(Options.generateHelp).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('Help');
      });
    });

    describe('with --help', () => {
      it('displays help', () => {
        spyOn(Options, 'generateHelp').and.returnValue('Help');
        CLI.execute({ help: true });
        expect(Options.generateHelp).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('Help');
      });
    });

    describe('with --version', () => {
      it('prints the version number', () => {
        CLI.execute({ version: true });
        const expectedVersion = `v${require('../../package.json').version}`;
        expect(console.log).toHaveBeenCalledWith(expectedVersion);
      });
    });
  });
});
