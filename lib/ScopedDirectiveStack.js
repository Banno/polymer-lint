'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

/**
 * @typedef {string[]} DirectiveArgs
 * @memberof ScopedDirectiveStack
 */

/**
 * @typedef {ScopedDirectiveStack.DirectiveArgs[]} DirectiveArgsStack
 * @memberof ScopedDirectiveStack
 */

/**
 * @typedef {Object.<string, ScopedDirectiveStack.DirectiveArgsStack>} DirectiveArgsStackObject
 * @memberof ScopedDirectiveStack
 */

// Private methods
const onDirective = Symbol('onDirective');
const onEnterScope = Symbol('onEnterScope');
const onLeaveScope = Symbol('onLeaveScope');
const initSnapshots = Symbol('initSnapshots');

// Private properties
const snapshots = Symbol('snapshots');

/**
 * @class ScopedDirectiveStack
 * @extends {Array}
 * @classdesc
 * A subclass of Array for tracking linter directives.
 *
 * ### The stack

 * ScopedDirectiveStack acts like a stack. Each item in the stack is a
 * [DirectiveArgsStackObject]{@link ScopedDirectiveStack.DirectiveArgsStackObject}
 * of the form:
 *
 * ```javascript
 * { 'directive-name': [
 *     [ 'arg1', 'arg2', ...  ],
 *     // ...
 *   ],
 *   // ...
 * }
 * ```
 *
 * In other words, each property's name is the name of a linter directive and
 * the corresponding value is an array of arrays of the arguments that have
 * been collected for that directive ([DirectiveArgsStack]{@link ScopedDirectiveStack.DirectiveArgsStack}).
 *
 * ScopedDirectiveStack listens for events emitted by the {@link SAXParser}
 * given to its [listenTo]{@link ScopedDirectiveStack#listenTo} method for the
 * `linterDirective`, `enterScope`, and `leaveScope` events. It responds in the
 * following ways:
 *
 *   * {@link SAXParser.event:linterDirective} - If the
 *     [DirectiveArgsStackObject]{@link ScopedDirectiveStack.DirectiveArgsStackObject}
 *     on top of the stack does not have a property with the name of the
 *     directive given by the event, one is initialized with an empty array
 *     ([DirectiveArgsStack]{@link ScopedDirectiveStack.DirectiveArgsStack}).
 *     Then the [DirectiveArgs]{@link ScopedDirectiveStack.DirectiveArgs} given
 *     by the event are pushed onto that array.
 *
 *     A snapshot is recorded (see "Snapshots").
 *
 *   * {@link SAXParser.event:enterScope} - A new, empty
 *     [DirectiveArgsStackObject]{@link ScopedDirectiveStack.DirectiveArgsStackObject}
 *     is pushed onto the stack.
 *
 *   * {@link SAXParser.event:leaveScope} - The top object is popped from the stack
 *     and a snapshot is recorded (see "Snapshots").
 *
 * ### Example
 *
 * Consider the following markup:
 *
 * ```text
 * 1| <foo>
 * 2|   <!-- directive-x grumpy, sleepy -->
 * 3|   Line three
 * 4|   <bar>
 * 5|     <!-- directive-x sneezy -->
 * 6|     <!-- directive-y doc -->
 * 7|     Line 7
 * 8|   </bar>
 * 9| </foo>
 * ```
 *
 * Before the parser parses line 1, the stack looks like this:
 *
 * ```text
 * top|bottom {}
 * ```
 *
 * The empty [DirectiveArgsStackObject]{@link ScopedDirectiveStack.DirectiveArgsStackObject}
 * represents the root scope. It's empty because no directives have been
 * encountered yet. After the parser parses line 1, the stack looks like this:
 *
 * ```text
 * # After line 1
 *    top {}
 * bottom {}
 * ```
 *
 * The parser entered a new scope (`<foo>`), so a new, empty object has been
 * pushed onto the stack. On the next line, line 2, the parser encounters a
 * directive, after which the stack looks like this:
 *
 * ```text
 * # After line 2
 *    top { directive-x: [ [ grumpy, sleepy ] ] }
 * bottom {}
 * ```
 *
 * Fast-forward to line 7. The parser has entered a new scope (`<bar>`) and
 * encountered two directive in that scope: another instance of `directive-x`,
 * and `directive-y`. The stack now looks like this:
 *
 * ```text
 * # After line 6
 *    top { directive-x: [ [ sneezy ] ], directive-y: [ [ doc ] ] }
 *      ⋮ { directive-x: [ [ grumpy, sleepy ] ] }
 * bottom {}
 * ```
 *
 * Inspecting the stack we can see which directives are "in effect," i.e. which
 * have been encountered so far in the current scope or its ancestors. We can
 * see that `directive-x` was encountered once with the arguments `grumpy` and
 * `sleepy` and once with the argument `sneezy`, and `directive-y` was
 * encountered once with the argument `doc`.
 *
 * ScopedDirectiveStack provides a convenience method
 * [getDirectiveArgs]{@link ScopedDirectiveStack#getDirectiveArgs} that will
 * traverse the stack and return an array of the arguments encountered with the
 * given directive name. By default it concatenates all of the
 * [DirectiveArgs]{@link ScopedDirectiveStack.DirectiveArgs} arrays into a
 * single array.
 *
 * ```javascript
 * // After line 6
 * stack.getDirectiveArgs('directive-x');
 * // => [ 'grumpy', 'sleepy', 'sneezy' ]
 *
 * stack.getDirectiveArgs('directive-x', { flatten: false });
 * // => [ [ 'grumpy', 'sleepy' ], [ 'sneezy' ] ]
 * ```
 *
 * On line 8 the parser leaves the `<bar>` scope, so the top of the stack is
 * popped off:
 *
 * ```text
 * # After line 8
 *    top { directive-x: [ [ grumpy, sleepy ] ] }
 * bottom {}
 * ```
 *
 * Inspecting the stack now we can see that `directive-y` is no longer "in
 * effect" because the parser left the scope in which it was encountered.
 *
 * ### Snapshots
 *
 * Whenever a `linterDirective` or `leaveScope` event is received, the
 * ScopedDirectiveStack will record a "snapshot" of itself along with the
 * {@link SAXParser.LocationInfo} object given by those events. This allows us
 * to inspect the state of the stack corresponding to any location.
 *
 * **Note:** A snapshot is *not* recorded when an `enterScope`
 * event is received, because those events do not affect which directives are
 * "in effect."
 *
 * A snapshot can be retrieved using the [snapshotAtLocation]{@link ScopedDirectiveStack#snapshotAtLocation}
 * method. For example, given the following markup:
 *
 * ```text
 * 1| <baz>
 * 2|   <!-- directive-x bashful, dopey -->
 * 3|   <qux>
 * 4|     <!-- directive-y happy -->
 * 5|     Line five
 * 6|   </qux>
 * 7|   Line seven
 * 8| </baz>
 * 9| Line nine
 * ```
 *
 * `snapshotAtLocation` would give us the following results (note the bottom-up
 * output, since stack is implemented with an Array whose beginning is the
 * bottom of the stack and whose end is the top):
 *
 * ```javascript
 * stack.snapshotAtLocation({ line: 5, col: 1 });
 * // => ScopedDirectiveStack [
 * //      {},
 * //      { 'directive-x': [ [ 'bashful', 'dopey' ] ] },
 * //      { 'directive-y': [ [ 'happy' ] ] }
 * //    ]
 *
 * stack.snapshotAtLocation({ line: 7, col: 1 });
 * // => ScopedDirectiveStack [
 * //      {},
 * //      { 'directive-x': [ [ 'bashful', 'dopey' ] ] }
 * //    ]
 *
 * stack.snapshotAtLocation({ line: 9, col: 1 });
 * // => ScopedDirectiveStack [ {} ]
 * ```
 */
class ScopedDirectiveStack extends Array {
  /**
   * @param {Object} options
   * @param {boolean} [options.snapshot]
   *    If `false`, will not initialize the `snapshots` array (for internal use).
   */
  constructor() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$snapshot = _ref.snapshot;
    let snapshot = _ref$snapshot === undefined ? true : _ref$snapshot;

    super();
    this.push({}); // initialize with root object
    if (snapshot) {
      this[initSnapshots]();
    }
  }

  [initSnapshots]() {
    // initial snapshot has no directives
    this[snapshots] = [[{ line: 1, col: 1 }, new this.constructor({ snapshot: false })]];
  }

  /**
   * Returns the item on top of the stack without popping it
   * @return {ScopedDirectiveStack.DirectiveArgsStackObject}
   */
  peek() {
    return this[this.length - 1];
  }

  /**
   * Get the arguments for the given directive from the stack.
   *
   * @param {string} name - The name of the directive
   * @param {Object} options
   * @param {boolean} [options.flatten=true]
   *    If true, the arguments will be flattened into a single Array
   * @return {string[]|Array.<string[]>}
   */
  getDirectiveArgs(name) {
    var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var _ref2$flatten = _ref2.flatten;
    let flatten = _ref2$flatten === undefined ? true : _ref2$flatten;

    return this.reduce((args, item) => {
      if (!item.hasOwnProperty(name)) {
        return args;
      }
      return args.concat.apply(args, _toConsumableArray(flatten ? item[name] : [item[name]]));
    }, []);
  }

  /**
   * Get the snapshot of the stack nearest to but not after the given
   * location (see "Snapshots").
   *
   * @param {LocationInfo} location
   * @return {ScopedDirectiveStack}
   */
  snapshotAtLocation(_ref3) {
    let line = _ref3.line;
    let col = _ref3.col;

    const snaps = this[snapshots];

    // Find the first snapshot whose subsequent snapshot's line/col position is
    // greater than the given line/col
    for (let i = 1, c = snaps.length; i <= c; i++) {
      const nextSnap = snaps[i];
      if (!nextSnap) {
        // Last snapshot
        return snaps[i - 1][1];
      }

      const nextSnapLoc = nextSnap[0];

      if (line < nextSnapLoc.line || line === nextSnapLoc.line && col < nextSnapLoc.col) {
        return snaps[i - 1][1];
      }
    }

    return null;
  }

  /**
   * Binds event listeners to the given SAXParser
   *
   * @param {SAXParser} parser
   * @listens SAXParser.event:linterDirective
   * @listens SAXParser.event:enterScope
   * @listens SAXParser.event:leaveScope
   * @return {void}
   */
  listenTo(parser) {
    parser.on('linterDirective', this[onDirective].bind(this));
    parser.on('enterScope', this[onEnterScope].bind(this));
    parser.on('leaveScope', this[onLeaveScope].bind(this));
  }

  /**
   * Returns a copy of itself
   * @return {ScopedDirectiveStack}
   */
  clone() {
    return this.constructor.from(this);
  }

  /**
   * Records the state of the stack at this location
   * @param {LocationInfo} location
   * @return {void}
   */
  snapshot(location) {
    this[snapshots].push([location, this.clone()]);
  }

  [onDirective](name, args, location) {
    const top = Object.assign({}, this.pop());
    const topArgs = top[name] || [];
    topArgs.push(args);
    top[name] = topArgs;
    this.push(top);

    this.snapshot(location);
  }

  [onEnterScope]() {
    this.push({}); // push object for new scope
  }

  [onLeaveScope](location) {
    this.pop();
    this.snapshot(location);
  }
}

module.exports = ScopedDirectiveStack;