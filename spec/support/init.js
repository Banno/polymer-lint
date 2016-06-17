global.helpers = (global.helpers || {});
Object.assign(global.helpers, require('./helpers'));

beforeEach(() => {
  jasmine.addMatchers(require('jasmine-node-promise-matchers'));
});
