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
        [ { name: 'include', value: 'good-component-2' } ], false, { attrs: {} });
      // <button is="good-component-3">
      mockParser.emit('startTag', 'button',
        [ { name: 'is', value: 'good-component-3' } ], false,
        { attrs: { is: { line: 1, col: 9 } } });

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
          [ { name: 'is', value: name } ], false,
          { attrs: { is: { line: 1, col: 11 } } });
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('when a component is used but has not been imported', () => {
    it('calls the onError callback with the expected arguments', () => {
      const badComponents = [ 'bad-component-1', 'bad-component-2', 'bad-component-3' ];
      const locations = [];

      // <bad-component-1>
      locations[0] = { line: 2, col: 15, attrs: {} };
      mockParser.emit('customElementStartTag', 'bad-component-1',
        [], false, locations[0]);

      // <style include="bad-component-2">
      locations[1] = { line: 3, col: 16, attrs: { include: { line: 3, col: 24 } } };
      mockParser.emit('startTag', 'style',
        [ { name: 'include', value: 'bad-component-2' } ], false, locations[1]);

      // <button is="bad-component-3">
      locations[2] = { line: 4, col: 17, attrs: { is: { line: 4, col: 26 } } };
      mockParser.emit('startTag', 'button',
        [ { name: 'is', value: 'bad-component-3' } ], false, locations[2]);

      expect(onError).toHaveBeenCalledTimes(badComponents.length);

      expect(onError).toHaveBeenCalledWith({
        message: `Custom element \'${badComponents[0]}\' used but not imported`,
        location: locations[0],
      });

      expect(onError).toHaveBeenCalledWith({
        message: `Custom element \'${badComponents[1]}\' used but not imported`,
        location: locations[1].attrs.include,
      });

      expect(onError).toHaveBeenCalledWith({
        message: `Custom element \'${badComponents[2]}\' used but not imported`,
        location: locations[2].attrs.is,
      });
    });
  });

  describe('when a <style include="..."> attribute has multiple names', () => {
    it('considers each name separately and calls the onError callback with the expected arguments', () => {
      // <style include="good-component-1 bad-component-1">
      const location = { line: 1, col: 8, startOffset: 7, endOffset: 48 };

      mockParser.emit('startTag', 'style',
        [ { name: 'include', value: 'good-component-1 bad-component-1' } ], false,
        { line: 1, col: 1, startOffset: 0, endOffset: 49,
          attrs: { include: location },
        }
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith({
        message: `Custom element \'bad-component-1\' used but not imported`,
        location,
      });
    });
  });
});
