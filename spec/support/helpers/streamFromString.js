const stream = require('stream');
global.helpers = (global.helpers || {});

/**
 * streamFromString
 * @param {string} string
 * @returns {stream.Readable} A Readable stream that will emit the given string
 */
function streamFromString(string) {
  const s = new stream.Readable();
  s.push(string); s.push(null);
  return s;
}

beforeAll(() => {
  global.helpers.streamFromString = streamFromString;
});
