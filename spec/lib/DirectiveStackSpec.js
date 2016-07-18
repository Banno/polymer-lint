const EventEmitter = require('events').EventEmitter;
const DirectiveStack = require('DirectiveStack');

describe('DirectiveStack', () => {
  let mockParser, stack;

  beforeEach(() => {
    mockParser = new EventEmitter();
    spyOn(mockParser, 'on').and.callThrough();
    stack = new DirectiveStack();
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

    describe('getDirectives', () => {
      beforeEach(() => {
        mockParser.emit('linterDirective', 'some-other-directive', [], {});
      });

      describe('when the given directives haven\'t been encountered', () => {
        it('returns an empty array', () => {
          expect(stack.getDirectives('directive-a', 'directive-b'))
            .toEqual([]);
        });
      });

      describe('when the given directives have been encountered', () => {
        it('returns the expected objects', () => {
          mockParser.emit('linterDirective', 'ignore-me', ['ignore-me-arg'], { line: 1, col: 10 });
          mockParser.emit('linterDirective', 'directive-a', ['a-arg-1-1', 'a-arg-1-2'], { line: 2, col: 20 });
          mockParser.emit('linterDirective', 'ignore-me-too', ['ignore-me-too-arg'], { line: 3, col: 30 });
          mockParser.emit('linterDirective', 'directive-b', ['b-arg'], { line: 4, col: 40 });
          mockParser.emit('linterDirective', 'directive-a', ['a-arg-2'], { line: 5, col: 50 });

          expect(stack.getDirectives('directive-a', 'directive-b'))
            .toEqual([
              { name: 'directive-a', args: ['a-arg-1-1', 'a-arg-1-2'], location: { line: 2, col: 20 } },
              { name: 'directive-b', args: ['b-arg'], location: { line: 4, col: 40 } },
              { name: 'directive-a', args: ['a-arg-2'], location: { line: 5, col: 50 } },
            ]);
        });
      });

      describe('in different scopes', () => {
        it('returns the expected objects', () => {
          /* eslint-disable indent */
          mockParser.emit('linterDirective', 'directive-a', ['a-arg-1-1', 'a-arg-1-2'], { line: 1, col: 1 });
          mockParser.emit('linterDirective', 'ignore-me', ['ignore-me-arg'], { line: 2, col: 3 });
          mockParser.emit('enterScope', {});
            mockParser.emit('linterDirective', 'ignore-me-too', ['ignore-me-too-arg'], { line: 4, col: 7 });
            mockParser.emit('linterDirective', 'directive-a', ['a-arg-2'], { line: 5, col: 9 });
            mockParser.emit('linterDirective', 'directive-b', ['b-arg-1'], { line: 6, col: 11 });
          mockParser.emit('leaveScope', {});
          mockParser.emit('linterDirective', 'directive-b', ['b-arg-2-1', 'b-arg-2-2'], { line: 8, col: 13 });
          mockParser.emit('linterDirective', 'directive-a', ['a-arg-3'], { line: 9, col: 15 });

          expect(stack.getDirectives('directive-a', 'directive-b'))
            .toEqual([
              { name: 'directive-a', args: ['a-arg-1-1', 'a-arg-1-2'], location: { line: 1, col: 1 } },
              { name: 'directive-b', args: ['b-arg-2-1', 'b-arg-2-2'], location: { line: 8, col: 13 } },
              { name: 'directive-a', args: ['a-arg-3'], location: { line: 9, col: 15 } },
            ]);
        });
      });
    });

    xdescribe('clone', () => {});
    xdescribe('snapshot', () => {});

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
        /* eslint-disable no-multi-spaces */
        [  1, [ [] ] ],
        [  3, [ [] ] ],
        [  5, [ [],
                [ { name: 'foo', args: ['xyz'], location: { line: 4, col: 1 } } ],
              ],
        ],
        [  7, [ [],
                [ { name: 'foo', args: ['xyz'], location: { line: 4, col: 1 } } ],
              ],
        ],
        [  9, [ [],
                [ { name: 'foo', args: ['xyz'], location: { line: 4, col: 1 } } ],
                [ { name: 'foo', args: [], location: { line: 8, col: 1 } } ],
              ],
        ],
        [ 11, [ [],
                [ { name: 'foo', args: ['xyz'], location: { line: 4, col: 1 } } ],
                [ { name: 'foo', args: [], location: { line: 8, col: 1 } },
                  { name: 'bar', args: ['abc'], location: { line: 10, col: 1 } },
                ],
              ],
        ],
        [ 13, [ [],
                [ { name: 'foo', args: ['xyz'], location: { line: 4, col: 1 } } ],
              ],
        ],
        [ 15, [ [],
                [ { name: 'foo', args: ['xyz'], location: { line: 4, col: 1 } },
                  { name: 'baz', args: [], location: { line: 14, col: 1 } },
                ],
              ],
        ],
        [ 17, [ [] ] ],
      ];

      beforeEach(() => {
        events.forEach(args => mockParser.emit(...args));
      });

      for (const [ line, snapshot ] of expectedSnapshots) {
        /* eslint-disable no-loop-func */
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
            .toEqual([[]]);
          expect(stack.snapshotAtLocation({ line: 18, col: 25 }))
            .toEqual([
              [ { name: 'directive-x', args: ['abc'], location: { line: 18, col: 5 } } ],
            ]);
          expect(stack.snapshotAtLocation({ line: 18, col: 47 }))
            .toEqual([
              [ { name: 'directive-x', args: ['abc'], location: { line: 18, col: 5 } },
                { name: 'directive-y', args: ['def'], location: { line: 18, col: 26 } },
              ]
            ]);
        });
      });
    });
  });

  describe('before any events have been received', () => {
    it('has an empty object on top of the stack', () => {
      expect(stack.peek()).toEqual([]);
    });
  });

  describe('after a linterDirective event has been received', () => {
    beforeEach(() => {
      mockParser.emit('linterDirective', 'foo', ['bar'], {});
    });

    it('the object on top of the stack has one property', () => {
      expect(stack.peek()).toEqual([ { name: 'foo', args: ['bar'], location: {} } ]);
    });

    describe('and a second linterDirective event with the same name has ' +
             'been received', () => {
      beforeEach(() => {
        mockParser.emit('linterDirective', 'foo', ['baz'], {});
      });

      it('the object on top of the stack has one properties and two sets ' +
         'of args', () => {
        expect(stack.peek()).toEqual([
          { name: 'foo', args: ['bar'], location: {} },
          { name: 'foo', args: ['baz'], location: {} },
        ]);
      });

      describe('and a third linterDirective event with a different name has ' +
               'been received', () => {
        beforeEach(() => {
          mockParser.emit('linterDirective', 'qux', [], {});
        });

        it('the object on top of the stack has two properties', () => {
          expect(stack.peek()).toEqual([
            { name: 'foo', args: ['bar'], location: {} },
            { name: 'foo', args: ['baz'], location: {} },
            { name: 'qux', args: [], location: {} },
          ]);
        });
      });
    });
  });

  describe('after an enterScope event has been received', () => {
    it('a new empty object has been pushed onto the stack', () => {
      mockParser.emit('linterDirective', 'foo', [], {});
      mockParser.emit('enterScope', {});
      expect(stack).toEqual([
        [ { name: 'foo', args: [], location: {} } ],
        [],
      ]);
    });
  });

  describe('after a leaveScope event has been received', () => {
    it('the top object has been popped off of the stack', () => {
      mockParser.emit('linterDirective', 'foo', [], {});
      mockParser.emit('enterScope', {});
      mockParser.emit('linterDirective', 'bar', [], {});

      expect(stack).toEqual([
        [ { name: 'foo', args: [], location: {} } ],
        [ { name: 'bar', args: [], location: {} } ]
      ]);

      mockParser.emit('leaveScope', {});

      expect(stack).toEqual([ [ { name: 'foo', args: [], location: {} } ] ]);
    });
  });
});
