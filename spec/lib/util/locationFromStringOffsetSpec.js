const locationFromStringOffset = require('util/locationFromStringOffset');

describe('locationFromStringOffset', () => {
  const testString =
  // col  1   5   10   15
  //      ⇓   ⇓    ⇓    ⇓
         'The quick \n' +        // line 1
  //      ⇡    ⇡
  // off  0    5
         'brown fox jumped \n' + // 2
  //      ⇡   ⇡    ⇡    ⇡
  // off 11  15   20   25
         'over \n' +             // 3
  //      ⇡
  // off 29
         'the lazy dog.';        // 4
  //      ⇡    ⇡    ⇡
  // off 35   40   45

  const from = { line: 3, col: 16, startOffset: 25 };

  const testCases = [
    { startOffset: 0,
      expectedLocation: { line: 1, col: 1, startOffset: 0, endOffset: 0 },
      expectedLocationWithFrom: { line: 3, col: 16, startOffset: 25, endOffset: 25 },
    },
    { startOffset: 10,
      expectedLocation: { line: 1, col: 11, startOffset: 10, endOffset: 10 },
      expectedLocationWithFrom: { line: 3, col: 26, startOffset: 35, endOffset: 35 },
    },
    { startOffset: 11,
      expectedLocation: { line: 2, col: 1, startOffset: 11, endOffset: 11 },
      expectedLocationWithFrom: { line: 4, col: 1, startOffset: 36, endOffset: 36 },
    },
    { startOffset: 20,
      expectedLocation: { line: 2, col: 10, startOffset: 20, endOffset: 20 },
      expectedLocationWithFrom: { line: 4, col: 10, startOffset: 45, endOffset: 45 },
    },
    { startOffset: 34,
      expectedLocation: { line: 3, col: 6, startOffset: 34, endOffset: 34 },
      expectedLocationWithFrom: { line: 5, col: 6, startOffset: 59, endOffset: 59 },
    },
    { startOffset: 35,
      expectedLocation: { line: 4, col: 1, startOffset: 35, endOffset: 35 },
      expectedLocationWithFrom: { line: 6, col: 1, startOffset: 60, endOffset: 60 },
    },
    { startOffset: 47,
      expectedLocation: { line: 4, col: 13, startOffset: 47, endOffset: 47 },
      expectedLocationWithFrom: { line: 6, col: 13, startOffset: 72, endOffset: 72 },
    },
  ];

  for (const { startOffset, expectedLocation, expectedLocationWithFrom } of testCases) {
    describe(`when 'startOffset' is ${startOffset}`, () => {
      it(helpers.inspect`returns a location with ${expectedLocation}`, () => {
        expect(locationFromStringOffset(testString, startOffset))
          .toEqual(jasmine.objectContaining(expectedLocation));
      });

      describe(helpers.inspect`and 'from' is ${from}`, () => {
        it(helpers.inspect`returns a location with ${expectedLocationWithFrom}`, () => {
          expect(locationFromStringOffset(testString, startOffset, from))
            .toEqual(jasmine.objectContaining(expectedLocationWithFrom));
        });
      });
    });
  }

  describe('when the string is empty', () => {
    const expectedLocation = { line: 1, col: 1, startOffset: 0, endOffset: 0 };

    it(helpers.inspect`returns ${expectedLocation}`, () => {
      expect(locationFromStringOffset('', 20))
        .toEqual(expectedLocation);
    });
  });

  describe('when endOffset is not given', () => {
    it('returns a location with endOffset equal to startOffset', () => {
      expect(locationFromStringOffset(testString, 10))
        .toEqual(jasmine.objectContaining({ endOffset: 10 }));
    });
  });

  describe('when endOffset is less than startOffset', () => {
    it('returns a location with endOffset equal to startOffset', () => {
      expect(locationFromStringOffset(testString, 10, 5))
        .toEqual(jasmine.objectContaining({ endOffset: 10 }));
    });
  });

  describe('when startOffset is greater than the offset of the last ' +
           'character of the string', () => {
    it('returns the location of the last character of the string', () => {
      expect(locationFromStringOffset(testString, 1000))
        .toEqual(locationFromStringOffset(testString, testString.length - 1));
    });
  });
});
