/**
 * SAXParser
 * @module lib/SAXParser
 *
 * A class that extends parse5.SAXParser to add some
 * Polymer-specific events (see Events above).
 */

/**
 * @external parse5
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation}
 */
const parse5 = require('parse5');

// Events

/**
 * domModuleStartTag event
 *
 * Emitted when the parser encounters a `<dom-module>`
 * start tag.
 *
 * @event SAXParser#domModuleStartTag
 * @param {string} id
 *   The id attribute of the dom-module tag
 * @param {Array.{name: string, value: string}} attrs
 *   The attributes of the tag as an array of objects of the
 *   form { name: string, value: string }
 * @param {boolean} selfClosing
 *   Indicates if the tag is self-closing
 * @param {external:parse5.StartTagLocationInfo} location
 *   The tag source code location info.
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_startTag}
 */

/**
 * domModuleEndTag event
 *
 * Emitted when the parser encounters a `</dom-module>`
 * end tag.
 *
 * @event SAXParser#domModuleEndTag
 * @param {external:parse5.LocationInfo} location
 *   The tag source code location info.
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_endTag}
 */

function getIdAttr(attrs) {
  const idAttr = attrs.find(({ name }) => name === 'id');
  return idAttr && idAttr.value;
}

const onStartTag = Symbol('onStartTag');
const onEndTag = Symbol('onEndTag');

/**
 * @class SAXParser
 * @extends external:parse5.SAXParser
 *
 * @emits SAXParser#domModuleStartTag
 * @emits SAXParser#domModuleEndTag
 */
class SAXParser extends parse5.SAXParser {
  /**
   * @param {parse5.SAXParserOptions} options
   * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#new_parse5+SAXParser_new}
  */
  constructor(options) {
    super(options);
    this.on('startTag', this[onStartTag]);
    this.on('endTag', this[onEndTag]);
  }

  [onStartTag](name, attrs, selfClosing, location) {
    if (name === 'dom-module') {
      const id = getIdAttr(attrs);
      this.emit('domModuleStartTag', id, attrs, selfClosing, location);
    }
  }

  [onEndTag](name, location) {
    if (name === 'dom-module') {
      this.emit('domModuleEndTag', location);
    }
  }
}

module.exports = SAXParser;
