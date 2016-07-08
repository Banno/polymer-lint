const { EventEmitter } = require('events');
const noAutoBinding = require('rules/no-auto-binding');

describe('no-auto-binding', () => {
  let mockParser, onError;

  beforeEach(() => {
    mockParser = new EventEmitter();
    onError = jasmine.createSpy('onError');
    noAutoBinding({}, mockParser, onError);
  });

  describe('when a one-way binding is used', () => {
    const expected = [
      { desc: 'as text content',
        emitArgs: [ 'text', '[[val]]' ]
      },
      { desc: 'as a property',
        emitArgs: [ 'startTag', 'a', [ { name: 'href', value: '[[val]]' } ], true ]
      },
      { desc: 'in compound text content',
        emitArgs: [ 'text', 'Hello, [[val]]!' ]
      },
      { desc: 'in a compound property',
        emitArgs: [ 'startTag', 'a', [ { name: 'href', value: '/users/[[val]]/profile' } ], true ]
      },
    ];

    for (const { desc, emitArgs } of expected) {
      /* eslint-disable no-loop-func */
      describe(desc, () => {
        it('doesn\'t call the onError callback', () => {
          mockParser.emit(...emitArgs);
          expect(onError).not.toHaveBeenCalled();
        });
      });
    }
  });

  describe('when an automatic binding is used', () => {
    describe('in text', () => {
      it('it calls the onError callback with the expected arguments', () => {
        /*
         * col:║ 1   5  8
         *     ║     │  │
         *  L1 ╫     <p>{{val}}</p>
         *     ║ ⇡   ⇡  ⇡      ⇡
         * off:║ 0   4  7     14
         */
        const textLoc = { line: 1, col: 8, startOffset: 7, endOffset: 14 };
        const expectedBindingLoc = { line: 1, col: 8, startOffset: 7, endOffset: 14 };

        mockParser.emit('text', '{{val}}', textLoc);
        expect(onError).toHaveBeenCalledWith({
          message: 'Unexpected automatic binding in text: {{val}}',
          location: expectedBindingLoc,
        });
      });

      describe('in a property', () => {
        it('calls the onError callback with the expected arguments', () => {
          /*
           * col:║ 1   5  8    14
           *     ║     │  │     │
           *  L1 ╫     <a href="{{val}}">⏎  // line 1
           *     ║ ⇡   ⇡  ⇡     ⇡      ⇡⇡⇡
           * off:║ 0   4  7    13     20│22
           *     ║                      21
           */
          const attrLoc = { line: 1, col: 8, startOffset: 7, endOffset: 21 };
          const startTagLoc = {
            line: 1, col: 5, startOffset: 4, endOffset: 22,
            attrs: { href: attrLoc },
          };
          const expectedBindingLoc = { line: 1, col: 14, startOffset: 13, endOffset: 20 };

          mockParser.emit('startTag', 'a', [ { name: 'href', value: '{{val}}' } ], false, startTagLoc);
          expect(onError).toHaveBeenCalledWith({
            message: 'Unexpected automatic binding in property \'href\': {{val}}',
            location: expectedBindingLoc,
          });
        });
      });

      describe('in compound text', () => {
        it('calls the onError callback with the expected arguments', () => {
          const text = 'Hello, {{val}}!';
          /*
           * col:║ 1   5  8     15
           *     ║        │      │
           *  L1 ╫     <p>Hello, {{val}}!</p> // line 1
           *     ║ ⇡      ⇡      ⇡      ⇡⇡
           * off:║ 0   4  7     14      │21
           *     ║                     22
           */
          const textLoc = { line: 1, col: 8, startOffset: 7, endOffset: 22 };
          const expectedBindingLoc = { line: 1, col: 15, startOffset: 14, endOffset: 21 };

          mockParser.emit('text', text, textLoc);
          expect(onError).toHaveBeenCalledWith({
            message: 'Unexpected automatic binding in text: {{val}}',
            location: expectedBindingLoc,
          });
        });
      });

      describe('in a compound property', () => {
        it('calls the onError callback with the expected arguments', () => {
          /*
           * col:║ 1   5  8    14     21
           *     ║     │  │     │      │
           *  L1 ╫     <a href="/users/{{val}}/profile">⏎  // line 1
           *     ║ ⇡   ⇡  ⇡     ⇡      ⇡      ⇡        ⇡⇡
           * off:║ 0   4  7    13     20     27        │37
           *     ║                                    36
           */
          const attrLoc = { line: 1, col: 8, startOffset: 7, endOffset: 36 };
          const startTagLoc = {
            line: 1, col: 5, startOffset: 4, endOffset: 37,
            attrs: { href: attrLoc }
          };
          const expectedBindingLoc =
            { line: 1, col: 21, startOffset: 20, endOffset: 27 };

          mockParser.emit('startTag', 'a', [ { name: 'href', value: '/users/{{val}}/profile' } ], false, startTagLoc);
          expect(onError).toHaveBeenCalledWith(jasmine.objectContaining({
            message: 'Unexpected automatic binding in property \'href\': {{val}}',
            location: expectedBindingLoc,
          }));
        });
      });

      describe('in compound text that spans multiple lines', () => {
        it('calls the onError callback with the expected arguments', () => {
          const text = '\n' +
            '  Here is an automatic\n' +
            '  binding: {{val}}!\n';
          /*
           * col:║ 1  4      12
           *     ║ │  │       │
           *  L1 ╫ <p>⏎       │
           *     ║ ⇡  ⇡       │
           * off:║ 0  3       │
           *  L2 ╫ ··Here is an automatic⏎
           *     ║ ⇡          │          ⇡
           *     ║ 4          │         26
           *  L3 ╫ ··binding: {{val}}!⏎
           *     ║ ⇡          ⇡      ⇡⇡
           *     ║ 27        38     45│
           *  L4 ╫ </p>               46
           *     ║ ⇡
           *     ║ 47
           */
          const textLoc = { line: 1, col: 4, startOffset: 3, endOffset: 47 };
          const expectedBindingLoc =
            { line: 3, col: 12, startOffset: 38, endOffset: 45 };

          mockParser.emit('text', text, textLoc);

          expect(onError).toHaveBeenCalledWith({
            message: 'Unexpected automatic binding in text: {{val}}',
            location: expectedBindingLoc,
          });
        });
      });

      describe('in a compound property that spans multiple lines', () => {
        it('calls the onError callback with the expected arguments', () => {
          const text =
            'Here\n' +
            '  is an automatic\n' +
            '  binding: {{val}}!\n';
          /*
           *     ║           12
           * col:║ 1  4       │13
           *     ║ │  │       ││
           *  L1 ╫ <a href="#"┊title="Here⏎
           *     ║ ⇡  ⇡       │⇡          ⇡
           * off:║ 0  3       │12        23
           *  L2 ╫ ··is an automatic⏎
           *     ║ ⇡          │     ⇡
           *     ║ 24         │    41
           *  L3 ╫ ··binding: {{val}}!⏎
           *     ║ ⇡          ⇡      ⇡⇡
           *     ║ 42         53    60│
           *  L4 ╫ ">                 61
           *     ║ ⇡⇡⇡
           *     ║62│64
           *     ║ 63
           */
          const attrLoc = { line: 1, col: 13, startOffset: 12, endOffset: 62 };
          const startTagLoc = {
            line: 1, col: 1, startOffset: 0, endOffset: 63,
            attrs: { title: attrLoc },
          };
          const expectedBindingLoc =
            { line: 3, col: 12, startOffset: 53, endOffset: 60 };

          mockParser.emit('startTag', 'a',
            [ { name: 'href', value: '#' }, { name: 'title', value: text } ],
            false, startTagLoc
          );

          expect(onError).toHaveBeenCalledWith({
            message: 'Unexpected automatic binding in property \'title\': {{val}}',
            location: expectedBindingLoc,
          });
        });
      });

      describe('in an attribute', () => {
        it('calls the onError callback with the expected message', () => {
          mockParser.emit('startTag', 'a',
            [ { name: 'href$', value: '{{val}}' } ], false,
            { line: 1, col: 1, startOffset: 0, endOffset: 20,
              attrs: { href$: { line: 1, col: 4, startOffset: 3, endOffset: 19 } },
            }
          );

          const message = 'Unexpected automatic binding in ' +
                          'attribute \'href$\': {{val}}';

          expect(onError).toHaveBeenCalledWith(
            jasmine.objectContaining({ message }));
        });
      });
    });
  });
});
