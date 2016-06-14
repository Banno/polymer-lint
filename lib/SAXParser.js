/**
 * SAXParser
 * @module lib/SAXParser
 *
 * A class that extends parse5.SAXParser to add some
 * Polymer-specific events (see Events below).
 */

/**
 * @external parse5
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation}
 */
const parse5 = require('parse5');

const isValidCustomElementName = require('./util/isValidCustomElementName');

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

/**
 * TODO: Document events
 */

function getAttribute(attrs, attrName) {
  const attr = attrs.find(({ name }) => name === attrName);
  return attr && attr.value;
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
    switch (name) {
      case 'dom-module': {
        const id = getAttribute(attrs, 'id');
        this.emit('domModuleStartTag', id, attrs, selfClosing, location);
        break;
      }
      case 'link': {
        const rel = getAttribute(attrs, 'rel');

        if (rel === 'import') {
          const href = getAttribute(attrs, 'href');
          this.emit('importTag', href, location);
        }
        break;
      }
      default:
        if (isValidCustomElementName(name)) {
          this.emit('customElementStartTag', name,
                    attrs, selfClosing, location);
        }
    }
  }

  [onEndTag](name, location) {
    if (name === 'dom-module') {
      this.emit('domModuleEndTag', location);
    } else if (isValidCustomElementName(name)) {
      this.emit('customElementEndTag', name, location);
    }
  }
}

module.exports = SAXParser;
