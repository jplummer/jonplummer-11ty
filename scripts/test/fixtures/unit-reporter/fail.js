// Fixture for scripts/test/unit-reporter.js. Not a real test; not in the manifest.
const { test } = require('node:test');
const assert = require('assert');
test('this one passes', () => {});
test('this one fails', () => { assert.strictEqual(1, 2, 'one is not two'); });
