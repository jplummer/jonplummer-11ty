// Fixture for scripts/test/unit-reporter.js. Not a real test; not in the manifest.
// A test that never settles. Without a timeout the whole run waits on it.
const { test } = require('node:test');

test('never settles', () => new Promise(() => {}));
