'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

/**
 * @typedef {{name: string, args: string[], location: LocationInfo}} Directive
 * @memberof DirectiveStack
 */

/**
 * @typedef {DirectiveStack.Directive[]} DirectiveScope
 * @memberof DirectiveStack
 */

// Private methods
const onDirective = Symbol('onDirective');
const onEnterScope = Symbol('onEnterScope');
const onLeaveScope = Symbol('onLeaveScope');
const initSnapshots = Symbol('initSnapshots');

// Private properties
const snapshots = Symbol('snapshots');

/**
 * @class DirectiveStack
 * @extends {Array}
 * @classdesc
 * A subclass of Array for tracking linter directives.
 *
 * ### The stack

 * DirectiveStack acts like a stack. Each item in the stack is a
 * [DirectiveScope]{@link DirectiveStack.DirectiveScope}, which is an array of
 * {@link DirectiveStack.Directive} objects of the form:
 *
 * ```javascript
 * { name: 'directive-name',
 *   args: [ 'arg1', 'arg2', ... ],
 *   location: { line: 10, col: 20 }
 * }
 * ```
 *
 * DirectiveStack listens for events emitted by the {@link SAXParser} given to
 * its [listenTo]{@link DirectiveStack#listenTo} method for the
 * `linterDirective`, `enterScope`, and `leaveScope` events. It responds in the following ways:
 *
 *   * {@link SAXParser.event:linterDirective} - A [Directive]{@link DirectiveStack.Directive}
 *     object is initialized with properties equal to the `name`, `args`, and
 *     `location` arguments given by the event.
 *
 *     A snapshot is recorded (see [Snapshots](#snapshots)).
 *
 *   * {@link SAXParser.event:enterScope} - A new, empty
 *     [DirectiveScope]{@link DirectiveStack.DirectiveScope}
 *     is pushed onto the stack.
 *
 *   * {@link SAXParser.event:leaveScope} - The top DirectiveScope array is
 *     popped from the stack and a snapshot is recorded
 *     (see [Snapshots](#snapshots)).
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
 * top|bottom []
 * ```
 *
 * The empty [DirectiveScope]{@link DirectiveStack.DirectiveScope}
 * represents the root scope. It's empty because no directives have been
 * encountered yet. After the parser parses line 1, the stack looks like this:
 *
 * ```text
 * # After line 1
 *    top []
 * bottom []
 * ```
 *
 * The parser entered a new scope (`<foo>`), so a new, empty object has been
 * pushed onto the stack. On the next line, line 2, the parser encounters a
 * directive, after which the stack looks like this:
 *
 * ```text
 * # After line 2
 *    top [ { name: 'directive-x', args: [ grumpy, sleepy ], location: ... } ]
 * bottom []
 * ```
 *
 * Fast-forward to line 7. The parser has entered a new scope (`<bar>`) and
 * encountered two directive in that scope: another instance of `directive-x`,
 * and `directive-y`. The stack now looks like this:
 *
 * ```text
 * # After line 6
 *    top [ { name: 'directive-x', args: [ sneezy ], ... },
 *          { name: 'directive-y', args: [ doc ], ... } ]
 *      ⋮ [ { name: 'directive-x', args: [ grumpy, sleepy ] } ]
 * bottom []
 * ```
 *
 * Inspecting the stack we can see which directives are "in effect," i.e. which
 * have been encountered so far in the current scope or its ancestors. We can
 * see that `directive-x` was encountered once with the arguments `grumpy` and
 * `sleepy` and once with the argument `sneezy`, and `directive-y` was
 * encountered once with the argument `doc`.
 *
 * DirectiveStack provides a convenience method [getDirectives]{@link DirectiveStack#getDirectives}
 * that will traverse the stack and return an flat array of the Directives
 * encountered with the given directive name(s). For example:
 *
 * ```javascript
 * // After line 6
 * stack.getDirective('directive-x');
 * // => [ { name: 'directive-x', args: ['grumpy', 'sleepy'], ... },
 * //      { name: 'directive-x', args: ['sneezy'], ... } ]
 * ```
 *
 * On line 8 the parser leaves the `<bar>` scope, so the top of the stack is
 * popped off:
 *
 * ```text
 * # After line 8
 *    top [ { name: 'directive-x', args: [ grumpy, sleepy ] } ]
 * bottom {}
 * ```
 *
 * Inspecting the stack now we can see that `directive-y` is no longer "in
 * effect" because the parser left the scope in which it was encountered.
 *
 * ### Snapshots
 *
 * Whenever a `linterDirective` or `leaveScope` event is received, the
 * DirectiveStack will record a "snapshot" of itself along with the
 * {@link SAXParser.LocationInfo} object given by those events. This allows us
 * to inspect the state of the stack corresponding to any location.
 *
 * **Note:** A snapshot is *not* recorded when an `enterScope` event is
 * received, because those events do not affect which directives are
 * "in effect."
 *
 * A snapshot can be retrieved using the [snapshotAtLocation]{@link DirectiveStack#snapshotAtLocation}
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
 * // => DirectiveStack [
 * //      [],
 * //      [ { name: 'directive-x', args: [ 'bashful', 'dopey' ], location: { line: 2, col: 3 } } ],
 * //      [ { name: 'directive-y': args: [ 'happy' ], location: { line: 4, col: 5 } } ]
 * //    ]
 *
 * stack.snapshotAtLocation({ line: 7, col: 1 });
 * // => DirectiveStack [
 * //      [],
 * //      [ { name: 'directive-x', args: [ 'bashful', 'dopey' ], location: { line: 2, col: 3 } } ],
 * //    ]
 *
 * stack.snapshotAtLocation({ line: 9, col: 1 });
 * // => DirectiveStack [ [] ]
 * ```
 */
class DirectiveStack extends Array {
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
    this.push([]); // initialize with root scope
    if (snapshot) {
      this[initSnapshots]();
    }
  }

  [initSnapshots]() {
    // initial snapshot has no directives
    this[snapshots] = [[{ line: 1, col: 1 }, new this.constructor({ snapshot: false })]];
  }

  /**
   * Returns the DirectiveScope array on top of the stack without popping it
   * @return {DirectiveStack.DirectiveScope}
   */
  peek() {
    return this[this.length - 1];
  }

  /**
   * Returns a flat array of directives on the stack with the given name(s). If
   * no arguments are given, all directives are returned.
   *
   * @param {...string} directiveNames - The names of the directives to return
   * @return {DirectiveStack.Directive[]} - The matching directives
   */
  getDirectives() {
    for (var _len = arguments.length, directiveNames = Array(_len), _key = 0; _key < _len; _key++) {
      directiveNames[_key] = arguments[_key];
    }

    return this.reduce((directives, scope) => directives.concat(directiveNames.length ? scope.filter(_ref2 => {
      let name = _ref2.name;
      return directiveNames.indexOf(name) !== -1;
    }) : scope), []);
  }

  /**
   * Get the snapshot of the stack nearest to but not after the given location
   * (see [Snapshots](#snapshots)).
   *
   * @param {LocationInfo} location
   * @return {DirectiveStack}
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
   * @return {DirectiveStack}
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
    const top = this.pop();
    this.push([].concat(_toConsumableArray(top), [{ name, args, location }]));
    this.snapshot(location);
  }

  [onEnterScope]() {
    this.push([]); // push object for new scope
  }

  [onLeaveScope](location) {
    this.pop();
    this.snapshot(location);
  }
}

module.exports = DirectiveStack;