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

/**
 * linterDirective event
 *
 * Emitted when the parser encounters a comment tag with a linter
 * directive e.g. `<!-- bplint-disable missing-imports -->`.
 *
 * @event SAXParser#linterDirective
 * @param {string} name - The name of the directive e.g. `bplint-disable`
 * @param {string[]} args - An array of any comma-delimited arguments following the directive name
 */

/**
 * enterScope event
 *
 * Emitted when the linter enters a scope (i.e. a start tag that is neither
 * self-closing nor a void element (see `VOID_ELEMENTS`).
 *
 * @event SAXParser#linterDirective
 * @param {LocationInfo} location
 */

/**
 * leaveScope event
 *
 * Emitted when the linter leaves a scope (i.e. and end tag).
 *
 * @event SAXParser#leaveScope
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
    this.on('comment', this[onComment]);
  }

  /**
   * @emits SAXParser#customElementStartTag
   * @emits SAXParser#domModuleStartTag
   * @emits SAXParser#importTag
   * @emits SAXParser#enterScope
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
   * @emits SAXParser#domModuleEndTag
   * @emits SAXParser#customElementEndTag
   * @emits SAXParser#leaveScope
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
   * @emits SAXParser#linterDirective
   */
  [onComment](text, location) {
    if (MATCH_DIRECTIVE_COMMENT.test(text)) {
      const [ name, args ] = [ RegExp.$1, RegExp.$2 ];
      this.emit('linterDirective', name, parseDirectiveArgs(args), location);
    }
  }
}

module.exports = SAXParser;
