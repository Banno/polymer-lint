const SAXParser = require('../../lib/SAXParser');

describe('SAXParser', () => {
  function attributesContaining(attrsObj) {
    return jasmine.arrayContaining(
      Object.keys(attrsObj).map(name => ({ name, value: attrsObj[name] }))
    );
  }

  describe('emits event', () => {
    const moduleId = 'foo-module';
    const importHref = 'bar/baz-module.html';

    const component = `
      <link rel="import" href="${importHref}"/>
      <dom-module id="${moduleId}">
        <template>
          Hello
          <${moduleId} foo="bar">World</${moduleId}>
        </template>

        <script>
          Polymer({ is: '${moduleId}' });
        </script>
      </dom-module>
    `;

    let file, parser;

    beforeEach(() => {
      file = helpers.streamFromString(component);
      parser = new SAXParser();
    });

    it('domModuleStartTag', done => {
      parser.on('domModuleStartTag', (name, attrs) => {
        expect(name).toEqual(moduleId);
        expect(attrs).toEqual(attributesContaining({ id: moduleId }));

        done();
      });

      file.pipe(parser);
    });

    it('domModuleEndTag', done => {
      parser.on('domModuleEndTag', done);
      file.pipe(parser);
    });

    it('importTag', done => {
      parser.on('importTag', href => {
        expect(href).toEqual(importHref);
        done();
      });

      file.pipe(parser);
    });

    it('customElementStartTag', done => {
      parser.on('customElementStartTag', (name, attrs, selfClosing) => {
        expect(name).toEqual(moduleId);
        expect(attrs).toEqual(attributesContaining({ foo: 'bar' }));
        expect(selfClosing).toEqual(false);
        done();
      });

      file.pipe(parser);
    });

    it('customElementEndTag', done => {
      parser.on('customElementEndTag', name => {
        expect(name).toEqual(moduleId);
        done();
      });

      file.pipe(parser);
    });

    it('linterDirective', done => {
      file = helpers.streamFromString(`
        <dom-module id="foo">
          <!-- bplint-disable -->
          <!-- bplint-disable arg1 -->
          <!-- bplint-disable arg1, -->
          <!--bplint-disable arg1, arg2-->
          <!--bplint-disable arg1,,arg2-->
          <!-- bplint-disable   arg1 arg2 -->
        </dom-module>
      `);

      const expectedEvents = [
        [ 'bplint-disable', [] ],
        [ 'bplint-disable', ['arg1'] ],
        [ 'bplint-disable', ['arg1'] ],
        [ 'bplint-disable', ['arg1', 'arg2'] ],
        [ 'bplint-disable', ['arg1', 'arg2'] ],
        [ 'bplint-disable', ['arg1 arg2'] ],
      ];

      const actualEvents = [];

      parser.on('linterDirective', (name, args) =>
        actualEvents.push([ name, args ])
      );

      parser.on('end', () => {
        expect(actualEvents).toEqual(expectedEvents);
        done();
      });

      file.pipe(parser);
    });
  });
});
