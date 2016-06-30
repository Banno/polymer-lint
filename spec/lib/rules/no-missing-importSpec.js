const EventEmitter = require('events').EventEmitter;

const noMissingImport = require('rules/no-missing-import');

describe('no-missing-import', () => {
  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');

    noMissingImport({}, mockParser, onError);

    mockParser.emit('importTag', 'good-component-1');
    mockParser.emit('importTag', 'good-component-2');
    mockParser.emit('importTag', 'good-component-3');
  });

  describe('when all components used have been imported', () => {
    it('does not call the onError callback', () => {
      // <good-component-1>
      mockParser.emit('customElementStartTag', 'good-component-1',
        [], false, {});
      // <style include="good-component-2">
      mockParser.emit('startTag', 'style',
        [ { name: 'include', value: 'good-component-2' } ], false, {});
      // <button is="good-component-3">
      mockParser.emit('startTag', 'button',
        [ { name: 'is', value: 'good-component-3' } ], false, {});

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when a built-in Polymer element is used', () => {
    it('does not call the onError callback', () => {
      [ 'array-selector', 'custom-style', 'dom-bind',
        'dom-if', 'dom-repeat', 'dom-template',
      ].forEach(name => {
        // <dom-repeat>
        mockParser.emit('customElementStartTag', name,
          [], false, {});
        // <template is="dom-repeat">
        mockParser.emit('startTag', 'template',
          [ { name: 'is', value: name } ], false, {});
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when a component is used but has not been imported', () => {
    it('calls the onError callback with the expected arguments', () => {
      const badComponents = [ 'bad-component-1', 'bad-component-2', 'bad-component-3' ];
      const locations = [ { line: 2, col: 15 }, { line: 3, col: 16 }, { line: 4, col: 17 } ];

      // <bad-component-1>
      mockParser.emit('customElementStartTag', 'bad-component-1',
        [], false, locations[0]);
      // <style include="bad-component-2">
      mockParser.emit('startTag', 'style',
        [ { name: 'include', value: 'bad-component-2' } ], false, locations[1]);
      // <button include="bad-component-3">
      mockParser.emit('startTag', 'button',
        [ { name: 'is', value: 'bad-component-3' } ], false, locations[2]);

      expect(onError).toHaveBeenCalledTimes(badComponents.length);

      badComponents.forEach((name, idx) =>
        expect(onError).toHaveBeenCalledWith({
          message: `Custom element \'${name}\' used but not imported`,
          location: locations[idx],
        })
      );
    });
  });
});
