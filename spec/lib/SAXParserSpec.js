const SAXParser = require('../../lib/SAXParser');

describe('SAXParser', () => {
  describe('event', () => {
    const moduleId = 'foo-module';

    const component = `
      <dom-module id="${moduleId}">
        <template>Hello</template>
        <script>
          Polymer({ is: '${moduleId}' });
        </script>
      </dom-module>
    `;

    let file, listener;

    beforeEach(() => {
      file = helpers.streamFromString(component);
      listener = jasmine.createSpy();
    });

    it('domModuleStartTag is emitted', (done) => {
      const parser = new SAXParser();
      parser.on('domModuleStartTag', listener);

      parser.on('end', () => {
        expect(listener).toHaveBeenCalled();

        const args = listener.calls.argsFor(0);
        expect(args[0]).toEqual(moduleId);

        done();
      });

      file.pipe(parser);
    });

    it('domModuleEndTag is emitted', (done) => {
      const parser = new SAXParser();
      parser.on('domModuleEndTag', listener);

      parser.on('end', () => {
        expect(listener).toHaveBeenCalled();
        done();
      });

      file.pipe(parser);
    });

    it('importTag is emitted');
    it('customElementStartTag is emitted');
    it('customElementEndTag is emitted');
  });
});
