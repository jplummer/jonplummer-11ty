// Fixture for scripts/test/unit-reporter.js. Not a real test; not in the manifest.
// Every test passes, then the cleanup hook throws.
const { test, after } = require('node:test');

after(() => {
  throw new Error('cleanup blew up');
});

test('passes', () => {});
