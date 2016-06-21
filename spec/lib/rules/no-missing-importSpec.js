const EventEmitter = require('events').EventEmitter;

const noMissingImport = require('../../../lib/rules/no-missing-import');

describe('no-missing-import', () => {
  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');

    noMissingImport({}, mockParser, onError);

    mockParser.emit('importTag', 'good-component-1');
    mockParser.emit('importTag', 'good-component-2');
  });

  describe('when all components used have been imported', () => {
    it('does not call the onError callback', () => {
      mockParser.emit('customElementStartTag', 'good-component-1', {}, false, {});
      mockParser.emit('customElementStartTag', 'good-component-2', {}, false, {});

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when a component is used but has not been imported', () => {
    it('calls the onError callback with the expected arguments', () => {
      const location = { line: 2, col: 15 };

      mockParser.emit('customElementStartTag', 'bad-component', {}, false, location);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith({
        message: 'Custom element <bad-component> used but not imported',
        location,
      });
    });
  });
});
