// Fixture for scripts/test/unit-reporter.js. Not a real test; not in the manifest.
// Tests exist, and none of them runs.
const { test } = require('node:test');

test.skip('skipped one', () => {});
test('skipped two', { todo: true }, () => {});
