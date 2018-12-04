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
      mockParser.emit('customElementStartTag', componentName, [], false, {});
      mockParser.emit('end');
    });

    it('does not call the onError callback', () => {
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when an imported component is used in a <style> tag\'s ' +
           '`include` attribute', () => {
    beforeEach(() => {
      // <style include="...">
      mockParser.emit('startTag', 'style',
        [ { name: 'include', value: componentName } ], false, {});
      mockParser.emit('end');
    });

    it('does not call the onError callback', () => {
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when an imported component is used in a built-in element\'s ' +
           '`is` attribute', () => {
    beforeEach(() => {
      // <button is="...">
      mockParser.emit('startTag', 'button',
        [ { name: 'is', value: componentName } ], false, {});
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
        message: `Component '${componentName}' was imported but never used`,
        location,
      });
    });
  });

  describe('when polymer-element is imported', () => {
    beforeEach(() => {
      mockParser.emit('importTag', `/foo/bar/polymer-element.html`, location);
      // only use the base test component
      mockParser.emit('customElementStartTag', componentName, [], false, {});
      mockParser.emit('end');
    });

    it('does not call the onError callback despite, polymer-element not being used', () => {
      expect(onError).not.toHaveBeenCalled();
    });
  })
});
