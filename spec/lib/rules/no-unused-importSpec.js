const { EventEmitter } = require('events');
const noUnusedImport = require('rules/no-unused-import');

describe('no-unused-import', () => {
  let mockParser, onError;
  const location = { line: 12, col: 2 };
  const componentName = 'foo-component';

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');
    noUnusedImport({}, mockParser, onError);
    mockParser.emit('importTag', `/foo/bar/${componentName}.html`, location);
  });

  describe('when all imported components are used', () => {
    beforeEach(() => {
      mockParser.emit('customElementStartTag', componentName, {}, false, {});
      mockParser.emit('end');
    });

    it('does not call the onError callback', () => {
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when an imported component is not used', () => {
    beforeEach(() => {
      mockParser.emit('end');
    });

    it('calls the onError callback with the expected arguments', () => {
      expect(onError).toHaveBeenCalledWith({
        message: `Component <${componentName}> was imported but never used`,
        location,
      });
    });
  });
});
