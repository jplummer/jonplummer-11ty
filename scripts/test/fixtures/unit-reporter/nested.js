// Fixture for scripts/test/unit-reporter.js. Not a real test; not in the manifest.
// The only failure is two levels down, inside a describe and a subtest.
const { test, describe } = require('node:test');
const assert = require('assert');

describe('a group', () => {
  test('outer', async (t) => {
    await t.test('inner fails', () => {
      assert.strictEqual(1, 2, 'deep failure');
    });
  });
});
