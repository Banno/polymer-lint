const { EventEmitter } = require('events');
const iconTitles = require('rules/icon-titles');

describe('icon-titles', () => {
  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');

    iconTitles({}, mockParser, onError);
  });

  describe('when icon tag has title attribute', () => {
    beforeEach(() => {
      mockParser.emit('startTag', 'jha-icon-chevron', [{name: "title", value: "foo"}], false, {});
    });

    it('does not call the onError callback', () => {
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when component is NOT an icon', () => {
    beforeEach(() => {
      mockParser.emit('startTag', 'jha-button', [], false, {});
    });

    it('does not call the onError callback', () => {
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when icon tag has no title attribute', () => {
    const location = { line: 6, col: 13 };
    beforeEach(() => {
      mockParser.emit('startTag', 'jha-icon-chevron', [], false, location);
    });

    it('calls onError as expected', () => {
      expect(onError).toHaveBeenCalledWith({
        message: 'Icon has no title attribute: jha-icon-chevron',
        location,
      });
    });
  });
});
