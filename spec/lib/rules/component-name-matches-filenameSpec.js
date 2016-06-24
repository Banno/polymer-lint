const EventEmitter = require('events').EventEmitter;

const componentNameMatchesFilename =
  require('rules/component-name-matches-filename');

describe('component-name-doesnt-match-filename', () => {
  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');
  });

  describe('when the component name matches the filename', () => {
    it('doesn\'t call the onError callback', () => {
      const componentName = 'good-component';
      const filename = `/foo/bar/${componentName}.html`;

      componentNameMatchesFilename({ filename }, mockParser, onError);
      mockParser.emit('domModuleStartTag', componentName, { id: componentName }, false, {});

      expect(onError).not.toHaveBeenCalledTimes(1);
    });
  });

  describe('when the component name doesn\'t match the filename', () => {
    it('calls the onError callback with the expected arguments', () => {
      const componentName = 'bad-component';
      const expectedComponentName = 'good-component';
      const filename = `/foo/bar/${expectedComponentName}.html`;
      const location = { line: 10, col: 20 };

      componentNameMatchesFilename({ filename }, mockParser, onError);
      mockParser.emit('domModuleStartTag', componentName, { id: componentName }, false, location);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith({
        message: `Expected '${expectedComponentName}.html' to declare component ` +
        `'${expectedComponentName}' but it declared '${componentName}'`,
        location,
      });
    });
  });
});
