const { EventEmitter } = require('events');
const noHashtagAnchors = require('rules/no-hashtag-anchors');

describe('no-hashtag-anchors', () => {
  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');
    noHashtagAnchors({}, mockParser, onError);
  });

  describe('when a hashtag anchor is used', () => {
    it('calls the onError callback with the expected arguments', () => {
      /*
        * col:║ 1   5  8    14
        *     ║     │  │     │
        *  L1 ╫     <a href="#">⏎  // line 1
        *     ║ ⇡   ⇡  ⇡     ⇡⇡⇡⇡
        * off:║ 0   4  7    13 15
        *     ║               14 16
        */
      const attrLoc = { line: 1, col: 8, startOffset: 7, endOffset: 15 };
      const startTagLoc = {
        line: 1, col: 5, startOffset: 4, endOffset: 16,
        attrs: { href: attrLoc },
      };
      const expectedBindingLoc = { line: 1, col: 14, startOffset: 13, endOffset: 14 };

      mockParser.emit('startTag', 'a', [ { name: 'href', value: '#' } ], false, startTagLoc);
      expect(onError).toHaveBeenCalledWith({
        message: 'Unexpected hashtag anchor',
        location: expectedBindingLoc,
      });
    });
  });
});
