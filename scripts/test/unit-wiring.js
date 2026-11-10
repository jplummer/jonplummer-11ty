#!/usr/bin/env node

/**
 * How unit tests are wired into `pnpm run test`: the manifest's rule that a
 * unit test is a node:test file (scripts/test-manifest.js), and what the
 * runner does with --format for one (scripts/test-runner.js).
 */

const { test } = require('node:test');
const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const { isNodeTestSource } = require('../test-manifest');

const RUNNER = path.join(__dirname, '..', 'test-runner.js');

function runOne(id, ...args) {
  const env = { ...process.env };
  // A nested `node --test` that inherits this prints nothing.
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, [RUNNER, id, ...args], { encoding: 'utf8', env });
  return { status: result.status, stdout: result.stdout };
}

test('requiring node:test is accepted in either quote style', () => {
  assert.strictEqual(isNodeTestSource("const { test } = require('node:test');\n"), true);
  assert.strictEqual(isNodeTestSource('const { test, after } = require("node:test");\n'), true);
});

test('naming node:test in a comment is not enough', () => {
  assert.strictEqual(isNodeTestSource("// const { test } = require('node:test');\n"), false);
  assert.strictEqual(isNodeTestSource("/**\n * Uses require('node:test').\n */\nconst x = 1;\n"), false);
});

test('requiring test-runner-helper is refused; naming it in a comment is not', () => {
  const header = "const { test } = require('node:test');\n";
  assert.strictEqual(isNodeTestSource(`${header}const { runTest } = require('../utils/test-runner-helper');\n`), false);
  assert.strictEqual(isNodeTestSource(`${header}// Once used test-runner-helper.\n`), true);
});

test('one unit test lists every test by name; --format build gives only its line', () => {
  const listed = /^ {4}✅ /m;
  const full = runOne('date-utils');
  assert.strictEqual(full.status, 0);
  assert.match(full.stdout, listed);

  const brief = runOne('date-utils', '--format', 'build');
  assert.strictEqual(brief.status, 0);
  assert.match(brief.stdout, /✅ .*Date Utils: 🧪 4 tests, ✅ 4 passing/);
  assert.doesNotMatch(brief.stdout, listed);
});
