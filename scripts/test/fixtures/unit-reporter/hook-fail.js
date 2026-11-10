// Fixture for scripts/test/unit-reporter.js. Not a real test; not in the manifest.
const { test, before } = require('node:test');
before(() => { throw new Error('browser did not start'); });
test('first', () => {});
test('second', () => {});
