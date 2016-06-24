const { EventEmitter } = require('events');
const oneComponent = require('rules/one-component');

describe('one-component', () => {
  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');

    oneComponent({}, mockParser, onError);
  });

  describe('when one component is defined', () => {
    beforeEach(() => {
      mockParser.emit('domModuleStartTag', 'foo', {}, false, {});
    });

    it('does not call the onError callback', () => {
      expect(onError).not.toHaveBeenCalled();
    });

    describe('and then a second component is defined', () => {
      const location = { line: 6, col: 13 };

      beforeEach(() => {
        mockParser.emit('domModuleStartTag', 'bar', {}, false, location);
      });

      it('calls the onError callback with the expected arguments', () => {
        expect(onError).toHaveBeenCalledWith({
          message: 'More than one component defined: bar',
          location,
        });
      });
    });
  });
});
