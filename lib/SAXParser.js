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

/**
 * ElementAttributes
 *
 * An array of attributes as an array of objects with `name` and
 * `value` properties.
 *
 * @typedef ElementAttributes
 * @type {Array.{name: string, value: string}}
 */

/**
 * @typedef parse5.StartTagLocationInfo
 * @type {Object}
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_startTag}
 */

// Events

/**
 * domModuleStartTag event
 *
 * Emitted when the parser encounters a `<dom-module>`
 * start tag.
 *
 * @event SAXParser#domModuleStartTag
 * @param {string} id - The `id` attribute of the dom-module tag
 * @param {ElementAttributes} attrs - The tag's attributes
 * @param {boolean} selfClosing - Indicates if the tag is self-closing
 * @param {external:parse5.StartTagLocationInfo} location
 *   The tag source code location info.
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#starttag-name-attrs-selfclosing-location}
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
 * importTag event
 *
 * Emitted when the parser encounters a `<link rel="import" href="..."/>` element.
 *
 * @event SAXParser#importTag
 * @param {string} href - The import href
 * @param {external:parse5.LocationInfo} location
 *   The tag source code location info.
 *
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_endTag}
 */

/**
 * customElementStartTag event
 *
 * Emitted when the parser encounters a custom element's start tag.
 *
 * @event SAXParser#customElementStartTag
 * @param {string} name - The name of the custom element
 * @param {ElementAttributes} attrs - The element's attributes
 * @param {boolean} selfClosing - Indicates if the element is self-closing
 * @param {parse5.StartTagLocationInfo} - The tag source code location info
 *
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#starttag-name-attrs-selfclosing-location}
 */

/**
 * customElementEndTag event
 *
 * Emitted when the parser encounters a custom element's end tag.
 *
 * @event SAXParser#customElementEndTag
 * @param {string} name - The name of the custom element
 * @param {parse5.LocationInfo}  - The tag source code location info
 *
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_endTag}
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
