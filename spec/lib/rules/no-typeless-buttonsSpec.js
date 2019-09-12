const { EventEmitter } = require('events');
const noAutoBinding = require('rules/no-typeless-buttons');

describe('no-typless-buttons', () => {
  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');
    noAutoBinding({}, mockParser, onError);
  });

  describe('when a button is used', () => {
    it('it calls the onError callback when type is not defined', () => {
      // <button>
      mockParser.emit('startTag', 'button', [], true, { attrs: {} });
      expect(onError).toHaveBeenCalled();

      // <button id="test">
      mockParser.emit('startTag', 'button',
      [ { name: 'id', value: 'test' } ], false,
      { attrs: { type: { line: 1, col: 9 } } });
      expect(onError).toHaveBeenCalled();
    });

    it('it does not call the onError callback when type is defined', () => {
      // <button type="button">
      mockParser.emit('startTag', 'button',
      [ { name: 'type', value: 'button' } ], false,
      { attrs: { type: { line: 1, col: 9 } } });
      expect(onError).not.toHaveBeenCalled();

      // <button id="test" type="submit">
      mockParser.emit('startTag', 'button',
      [ { name: 'id', value: 'test' }, { name: 'type', value: 'submit' } ], false,
      { attrs: {
        id: { line: 1, col: 9 },
        type: { line: 1, col: 19 } }
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when a jha-button is used', () => {
    it('it calls the onError callback when type is not defined', () => {
      // <jha-button>
      mockParser.emit('startTag', 'jha-button', [], true, { attrs: {} });
      expect(onError).toHaveBeenCalled();

      // <jha-button id="test">
      mockParser.emit('startTag', 'jha-button',
      [ { name: 'id', value: 'test' } ], false,
      { attrs: { type: { line: 1, col: 13 } } });
      expect(onError).toHaveBeenCalled();
    });

    it('it does not call the onError callback when type is defined', () => {
      // <jha-button type="button">
      mockParser.emit('startTag', 'jha-button',
      [ { name: 'type', value: 'button' } ], false,
      { attrs: { type: { line: 1, col: 13 } } });
      expect(onError).not.toHaveBeenCalled();

      // <jha-button id="test" type="submit">
      mockParser.emit('startTag', 'jha-button',
      [ { name: 'id', value: 'test' }, { name: 'type', value: 'submit' } ], false,
      { attrs: {
        id: { line: 1, col: 13 },
        type: { line: 1, col: 23 } }
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
