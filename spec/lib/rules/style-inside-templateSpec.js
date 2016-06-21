const { EventEmitter } = require('events');
const styleInsideTemplate = require('../../../lib/rules/style-inside-template');

describe('style-inside-template', () => {
  const location = { line: 2, col: 3 };

  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');
    styleInsideTemplate({}, mockParser, onError);
  });

  describe('when <style> is inside <template>', () => {
    beforeEach(() => {
      mockParser.emit('startTag', 'template', {}, false, {});
    });

    it('does not call the onError callback', () => {
      mockParser.emit('startTag', 'style', {}, false, {});
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when <style> is before <template>', () => {
    it('calls the onError callback with the expected arguments', () => {
      mockParser.emit('startTag', 'style', {}, false, location);
      mockParser.emit('startTag', 'template', {}, false, {});

      expect(onError).toHaveBeenCalledWith({
        message: '<style> tag outside of <template>', location,
      });
    });
  });

  describe('when <style> is after </template>', () => {
    it('calls the onError callback with the expected arguments', () => {
      mockParser.emit('startTag', 'template', {}, false, {});
      mockParser.emit('endTag', 'template');
      mockParser.emit('startTag', 'style', {}, false, location);

      expect(onError).toHaveBeenCalledWith({
        message: '<style> tag outside of <template>', location,
      });
    });
  });

  describe('when <template> is self-closing', () => {
    it('calls the onError callback with the expected arguments', () => {
      const selfClosing = true;
      mockParser.emit('startTag', 'template', {}, selfClosing, {});
      mockParser.emit('startTag', 'style', {}, false, location);

      expect(onError).toHaveBeenCalledWith({
        message: '<style> tag outside of <template>', location,
      });
    });
  });
});
