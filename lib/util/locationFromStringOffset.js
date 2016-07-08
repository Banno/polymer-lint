'use strict';

// util/locationFromStringOffset

var _require = require('util');

const isObject = _require.isObject;


function defaultLocation() {
  return { line: 1, col: 1, startOffset: 0, endOffset: 0 };
}

// "Adds" a location to an initial ("from") location. The rules for this are weird because:
//
//   1. `line` and `col` are 1-based, so 1 must be subtracted from the result of adding either.
//   2. A newline "resets" the "from" column number to 1.
//
// For these reasons, this addition is not commutative.
function addLocations(fromLocation, addedLocation) {
  const result = Object.assign(defaultLocation(), fromLocation);
  const added = Object.assign(defaultLocation(), addedLocation);

  if (added.line !== 1) {
    result.col = 1;
  }

  result.line += added.line - 1;
  result.col += added.col - 1;
  result.startOffset += added.startOffset;
  result.endOffset = result.startOffset + (added.endOffset - added.startOffset);

  return result;
}

/**
 * Calculates 1-based line and column indexes from a zero-based offset and
 * returns a LocationInfo object. If the optional `from` argument is given,
 * the calculated values will be "added" to those in the given object
 * (see examples).
 *
 * @function locationFromStringOffset
 * @memberof module:lib/util
 * @param {string} str - The string for the offset
 * @param {number} startOffset - The zero-based start offset
 * @param {number} [endOffset]
 *   The zero-based end offset; if not given, `startOffset` will be used
 *   for both.
 * @param {LocationInfo} [from]
 *   An optional LocationInfo object representing the offset's position relative
 *   to a larger document
 * @return {LocationInfo}
 *   A LocationInfo object with the numeric properties line, col, startOffset
 *   and endOffset.
 *
 * @example
 * const str = `foo⏎
 * bar baz⏎
 * qux`;
 *
 * locationFromStringOffset(str, 2); // The second "o" in "foo"
 * // => { line: 1, col: 3, startOffset: 2, endOffset: 2 }
 *
 * locationFromStringOffset(str, 9, 11); // The word "baz"
 * // => { line: 2, col: 5, startOffset: 9, endOffset: 11 }
 *
 * locationFromStringOffset(str, 2, { line: 5, col: 10, startOffset: 25 });
 * // => { line: 5, col: 12, startOffset: 27, 27 }
 */
module.exports = function locationFromStringOffset(str, startOffset) {
  // Terminology note: In the below code, "offset" always means the number of
  // characters from the beginning of the string (NOT the beginning of a line),
  // where the first character has offset 0.
  let endOffset, from;

  for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    rest[_key - 2] = arguments[_key];
  }

  if (!rest.length) {
    // No `endOffset` or `from` args given
    endOffset = startOffset;
    from = defaultLocation();
  } else if (rest.length >= 2) {
    endOffset = rest[0];
    // Both `endOffset` and `from` arg given

    from = rest[1];
  } else {
    // Only one arg given
    const arg = rest[0];
    from = defaultLocation();

    if (isObject(arg)) {
      // Only `from` arg given
      endOffset = startOffset;
      Object.assign(from, {
        line: arg.line,
        col: arg.col,
        startOffset: arg.startOffset
      });
    } else {
      // Only `endOffset` given
      endOffset = arg;
    }
  }

  if (!str.length) {
    return Object.assign(from, { endOffset: from.startOffset });
  }

  endOffset = Math.max(endOffset, startOffset);
  const location = { startOffset, endOffset };

  // endOffset should be equal to or greater than startOffset.
  if (typeof endOffset === 'undefined' || endOffset < startOffset) {
    location.endOffset = startOffset;
  }

  // If startOffset is greater than the index of the last character of the
  // string, return the location of the last character of the string.
  if (startOffset > str.length - 1) {
    return locationFromStringOffset(str, str.length - 1);
  }

  // Walk the string until startOffset, counting newlines as we go
  let lineStartOffset; // eslint-disable-line one-var
  let nlOffset = 0; // Offset of the last newline counted
  let line = 0;

  while (nlOffset <= startOffset) {
    line++;
    // Offset of the beginning of this line
    lineStartOffset = nlOffset;
    // Get offset of next newline
    nlOffset = str.indexOf('\n', nlOffset);

    if (nlOffset === -1) {
      // No more newlines
      break;
    }

    // Advance one character to move to the start of the next line.
    nlOffset++;
  }

  const col = startOffset - lineStartOffset + 1;
  Object.assign(location, { line, col });

  return addLocations(from, location);
};