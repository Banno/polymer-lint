const stream = require('stream');

/**
 * helpers.streamFromString
 * @param {string} string
 * @returns {stream.Readable} A Readable stream that will emit the given string
 */
function streamFromString(string) {
  const s = new stream.Readable();
  s.push(string); s.push(null);
  return s;
}

module.exports = streamFromString;
