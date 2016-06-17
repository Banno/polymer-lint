const EventEmitter = require('events').EventEmitter;
const ScopedDirectiveStack = require('../../lib/ScopedDirectiveStack');

describe('ScopedDirectiveStack', () => {
  let mockParser, stack;

  beforeEach(() => {
    mockParser = new EventEmitter();
    spyOn(mockParser, 'on').and.callThrough();
    stack = new ScopedDirectiveStack();
    stack.listenTo(mockParser);
  });

  describe('instance method', () => {
    describe('listenTo', () => {
      it('registers a listener for the linterDirective event', () => {
        expect(mockParser.on)
          .toHaveBeenCalledWith('linterDirective', jasmine.any(Function));
      });

      it('registers a listener for the enterScope event', () => {
        expect(mockParser.on)
          .toHaveBeenCalledWith('enterScope', jasmine.any(Function));
      });

      it('registers a listener for the leaveScope event', () => {
        expect(mockParser.on)
          .toHaveBeenCalledWith('leaveScope', jasmine.any(Function));
      });
    });

    describe('peek', () => {
      it('returns the top of the stack without popping it', () => {
        mockParser.emit('linterDirective', 'foo', ['bar'], {});
        const actual = stack.peek();
        expect(actual).toEqual(stack.pop());
      });
    });

    describe('getDirectiveArgs', () => {
      beforeEach(() => {
        mockParser.emit('linterDirective', 'some-other-directive', [], {});
      });

      describe('when the given directive hasn\'t been encountered', () => {
        it('returns an empty array', () => {
          mockParser.emit('linterDirective', 'foo', [], {});
          expect(stack.getDirectiveArgs('not-foo')).toEqual([]);
        });
      });

      describe('when given directive has been encountered', () => {
        beforeEach(() => {
          mockParser.emit('linterDirective', 'foo', ['bar', 'baz'], {});
        });

        it('returns its arguments', () => {
          expect(stack.getDirectiveArgs('foo')).toEqual(['bar', 'baz']);
          expect(stack.getDirectiveArgs('foo', { flatten: false }))
            .toEqual([['bar', 'baz']]);
        });

        describe('and then encountered again', () => {
          beforeEach(() => {
            mockParser.emit('enterScope', {});
            mockParser.emit('linterDirective', 'foo', ['qux'], {});
          });

          it('returns their arguments', () => {
            expect(stack.getDirectiveArgs('foo'))
              .toEqual(['bar', 'baz', 'qux']);
            expect(stack.getDirectiveArgs('foo', { flatten: false }))
              .toEqual([['bar', 'baz'], ['qux']]);
          });
        });
      });
    });


    describe('clone', () => {
    });

    describe('snapshot', () => {
    });

    describe('snapshotAtLocation', () => {
      const events = [
        [ 'enterScope', { line: 2, col: 1 } ],
          [ 'linterDirective', 'foo', [ 'xyz' ], { line: 4, col: 1 } ],
          [ 'enterScope', { line: 6, col: 1 } ],
            [ 'linterDirective', 'foo', [], { line: 8, col: 1 } ],
            [ 'linterDirective', 'bar', ['abc'], { line: 10, col: 1 } ],
            [ 'leaveScope', { line: 12, col: 1 } ],
          [ 'linterDirective', 'baz', [], { line: 14, col: 1 } ],
          [ 'leaveScope', { line: 16, col: 1 } ],
      ];

      const expectedSnapshots = [
        [  1, [ {} ] ],
        [  3, [ {} ] ],
        [  5, [ {}, { foo: [['xyz']] } ] ],
        [  7, [ {}, { foo: [['xyz']] } ] ],
        [  9, [ {}, { foo: [['xyz']] }, { foo: [[]] } ] ],
        [ 11, [ {}, { foo: [['xyz']] }, { foo: [[]], bar: [['abc']] } ] ],
        [ 13, [ {}, { foo: [['xyz']] } ] ],
        [ 15, [ {}, { foo: [['xyz']], baz: [[]] } ] ],
        [ 17, [ {} ] ],
      ];

      beforeEach(() => {
        events.forEach(args => mockParser.emit(...args));
      });

      for (const [ line, snapshot ] of expectedSnapshots) {
        it(helpers.inspect`returns ${snapshot} for line ${line}`, () => {
          const actual = stack.snapshotAtLocation({ line, col: 1 });
          expect(actual).toEqual(snapshot);
        });
      }

      describe('when multiple linterDirective events with the same line number are encountered', () => {
        beforeEach(() => {
          // 17|
          // 18| Foo <!-- directive-x --> <!-- directive-y --> Bar
          // 19|     ↑                    ↑                    ↑
          //  ⋮| col 5                   26                   47
          mockParser.emit('linterDirective', 'directive-x', ['abc'], { line: 18, col: 5 });
          mockParser.emit('linterDirective', 'directive-y', ['def'], { line: 18, col: 26 });
        });

        it('returns the expected snapshots for the given locations', () => {
          expect(stack.snapshotAtLocation({ line: 18, col: 1 }))
            .toEqual([{}]);
          expect(stack.snapshotAtLocation({ line: 18, col: 25 }))
            .toEqual([ { 'directive-x': [['abc']] } ]);
          expect(stack.snapshotAtLocation({ line: 18, col: 47 }))
            .toEqual([ { 'directive-x': [['abc']], 'directive-y': [['def']] } ]);
        });
      });
    });
  });

  describe('before any events have been received', () => {
    it('has an empty object on top of the stack', () => {
      expect(stack.peek()).toEqual({});
    });
  });

  describe('after a linterDirective event has been received', () => {
    beforeEach(() => {
      mockParser.emit('linterDirective', 'foo', ['bar'], {});
    });

    it('the object on top of the stack has one property', () => {
      expect(stack.peek()).toEqual({ foo: [['bar']] });
    });

    describe('and a second linterDirective event with the same name has ' +
             'been received', () => {
      beforeEach(() => {
        mockParser.emit('linterDirective', 'foo', ['baz'], {});
      });

      it('the object on top of the stack has one properties and two sets ' +
         'of args', () => {
        expect(stack.peek()).toEqual({ foo: [['bar'], ['baz']] });
      });

      describe('and a third linterDirective event with a different name has ' +
               'been received', () => {
        beforeEach(() => {
          mockParser.emit('linterDirective', 'qux', [], {});
        });

        it('the object on top of the stack has two properties', () => {
          expect(stack.peek()).toEqual({ foo: [['bar'], ['baz']], qux: [[]] });
        });
      });
    });
  });

  describe('after an enterScope event has been received', () => {
    it('a new empty object has been pushed onto the stack', () => {
      mockParser.emit('linterDirective', 'foo', [], {});
      mockParser.emit('enterScope', {});
      expect(stack).toEqual([ { foo: [[]] }, {} ]);
    });
  });

  describe('after a leaveScope event has been received', () => {
    it('the top object has been popped off of the stack', () => {
      mockParser.emit('linterDirective', 'foo', [], {});
      mockParser.emit('enterScope', {});
      mockParser.emit('linterDirective', 'bar', [], {});
      expect(stack).toEqual([ { foo: [[]] }, { bar: [[]] } ]);
      mockParser.emit('leaveScope', {});
      expect(stack).toEqual([ { foo: [[]] } ]);
    });
  });
});
