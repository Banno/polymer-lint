// SAXParser

/**
 * @external parse5
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation}
 */

/**
 * @typedef LocationInfo
 * @type {Object}
 * @property {number} line - A 1-based line number
 * @property {number} col - A 1-based column number
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation}
 */
const parse5 = require('parse5');

const isValidCustomElementName = require('./util/isValidCustomElementName');

/**
 *
 * @typedef ElementAttributes
 * @description An array of attributes as an array of objects with `name` and
 *   `value` properties.
 * @type {Array<{name: string, value: string}>}
 * @memberof SAXParser
 */

// Events

/**
 * @event startTag
 * @memberof SAXParser
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_startTag}
 */

/**
 *
 * @event domModuleStartTag
 * @memberof SAXParser
 * @description Emitted when the parser encounters a `<dom-module>` start tag.
 * @param {string} id - The `id` attribute of the dom-module tag
 * @param {SAXParser.ElementAttributes} attrs - The tag's attributes
 * @param {boolean} selfClosing - Indicates if the tag is self-closing
 * @param {LocationInfo} location
 *   The tag source code location info.
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#starttag-name-attrs-selfclosing-location}
 */

/**
 * @event domModuleEndTag
 * @memberof SAXParser
 * @description Emitted when the parser encounters a `</dom-module>` end tag.
 * @param {LocationInfo} location
 *   The tag source code location info.
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_endTag}
 */

/**
 * @event importTag
 * @memberof SAXParser
 * @description Emitted when the parser encounters a
 *   `<link rel="import" href="..."/>` element.
 * @param {string} href - The import href
 * @param {LocationInfo} location
 *   The tag source code location info.
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_endTag}
 */

/**
 * @event customElementStartTag
 * @memberof SAXParser
 * @description Emitted when the parser encounters a custom element's start tag.
 * @param {string} name - The name of the custom element
 * @param {SAXParser.ElementAttributes} attrs - The element's attributes
 * @param {boolean} selfClosing - Indicates if the element is self-closing
 * @param {LocationInfo} - The tag source code location info
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#starttag-name-attrs-selfclosing-location}
 */

/**
 * @event customElementEndTag
 * @memberof SAXParser
 * @description Emitted when the parser encounters a custom element's end tag.
 * @param {string} name - The name of the custom element
 * @param {LocationInfo}  - The tag source code location info
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser+event_endTag}
 */

/**
 * @event linterDirective
 * @memberof SAXParser
 * @description Emitted when the parser encounters a comment tag with a linter
 *   directive e.g. `<!-- bplint-disable missing-imports -->`.
 * @param {string} name - The name of the directive e.g. `bplint-disable`
 * @param {string[]} args - An array of any comma-delimited arguments following the directive name
 */

/**
 * @event enterScope
 * @memberof SAXParser
 * @description Emitted when the linter enters a scope (i.e. a start tag that is
 *   neither self-closing nor a void element (see `VOID_ELEMENTS`).
 * @param {LocationInfo} location
 */

/**
 * @event leaveScope
 * @memberof SAXParser
 * @description Emitted when the linter leaves a scope (i.e. an end tag).
 * @param {LocationInfo} location
 */

function getAttribute(attrs, attrName) {
  const attr = attrs.find(({ name }) => name === attrName);
  return attr && attr.value;
}

const SPLIT_DIRECTIVE_ARGS_EXPR = /\s*(?:,\s*)+/;

function parseDirectiveArgs(argsStr) {
  return argsStr.split(SPLIT_DIRECTIVE_ARGS_EXPR)
    .filter(arg => arg.length);
}

const MATCH_DIRECTIVE_COMMENT = /^\s*(bplint-disable)\s*(.*?)\s*$/;

// Elements that are implicitly self-closing
const VOID_ELEMENTS = {
  /* eslint-disable no-multi-spaces */
  area: true, base: true,  br: true,     col: true,    embed: true,
  hr: true,   img: true,   input: true,  keygen: true, link: true,
  meta: true, param: true, source: true, track: true,  wbr: true,
};

function isVoidElement(name) {
  return VOID_ELEMENTS[name];
}

const onStartTag = Symbol('onStartTag');
const onEndTag = Symbol('onEndTag');
const onComment = Symbol('onComment');

/**
 * @classdesc A class that extends parse5.SAXParser to add some Polymer-specific
 *   events (see Events above).
 * @extends external:parse5.SAXParser
 * @emits SAXParser.event:domModuleStartTag
 * @emits SAXParser.event:domModuleEndTag
 * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#parse5+SAXParser}
 */
class SAXParser extends parse5.SAXParser {
  /**
   * @constructor
   * @override
   * @param {Object} options
   * @see {@link https://github.com/inikulin/parse5/wiki/Documentation#new_parse5+SAXParser_new}
  */
  constructor(options) {
    super(Object.assign({}, { locationInfo: true }, options));
    this.on('startTag', this[onStartTag]);
    this.on('endTag', this[onEndTag]);
    this.on('comment', this[onComment]);
  }

  /**
   * @param {string} name
   * @param {Object<string,string>} attrs
   * @param {boolean} selfClosing
   * @param {parse5.StartTagLocationInfo} location
   *
   * @emits SAXParser.event:customElementStartTag
   * @emits SAXParser.event:domModuleStartTag
   * @emits SAXParser.event:importTag
   * @emits SAXParser.event:enterScope
   *
   * @return {void}
   */
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

    if (!selfClosing && !isVoidElement(name)) {
      this.emit('enterScope', location);
    }
  }

  /**
   * @param {string} name
   * @param {parse5.LocationInfo} location
   *
   * @emits SAXParser.event:domModuleEndTag
   * @emits SAXParser.event:customElementEndTag
   * @emits SAXParser.event:leaveScope
   *
   * @return {void}
   */
  [onEndTag](name, location) {
    if (name === 'dom-module') {
      this.emit('domModuleEndTag', location);
    } else if (isValidCustomElementName(name)) {
      this.emit('customElementEndTag', name, location);
    }

    this.emit('leaveScope', location);
  }

  /**
   * @param {string} text
   * @param {parse5.LocationInfo} location
   *
   * @emits SAXParser.event:linterDirective
   *
   * @return {void}
   */
  [onComment](text, location) {
    if (MATCH_DIRECTIVE_COMMENT.test(text)) {
      const [ name, args ] = [ RegExp.$1, RegExp.$2 ];
      this.emit('linterDirective', name, parseDirectiveArgs(args), location);
    }
  }
}

module.exports = SAXParser;
