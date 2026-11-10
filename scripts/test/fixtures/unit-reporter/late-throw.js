// Fixture for scripts/test/unit-reporter.js. Not a real test; not in the manifest.
// Every test passes, then the file throws on its way out. Node fails the file.
const { test } = require('node:test');

test('passes', () => {});

setTimeout(() => {
  throw new Error('thrown after the tests finished');
}, 20);
