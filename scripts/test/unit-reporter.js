#!/usr/bin/env node

/**
 * Tests scripts/utils/unit-reporter.js, the node:test reporter that prints
 * one result line per unit test file with real counts. Runs `node --test`
 * against small fixture files and reads what the reporter printed.
 *
 * Each case is something Node's own rules would let through or hide: a file
 * with no tests counts as a pass, a skipped test is reported as a pass, and
 * a file that crashes on load sends no summary at all, and a file that
 * throws after its tests passed still has all-passing counts.
 */

const { test } = require('node:test');
const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const { fileOutcome, nodeTestArgs } = require('../utils/unit-reporter');

const FIXTURES = path.join(__dirname, 'fixtures', 'unit-reporter');

function run(fixtureNames, extraEnv = {}, { relative = false, timeoutMs } = {}) {
  const env = { ...process.env, ...extraEnv };
  // A nested `node --test` that inherits this prints nothing.
  delete env.NODE_TEST_CONTEXT;
  if (!('UNIT_REPORT_VERBOSE' in extraEnv)) delete env.UNIT_REPORT_VERBOSE;
  const files = fixtureNames.map((name) => (relative ? name : path.join(FIXTURES, name)));
  const result = spawnSync(process.execPath, nodeTestArgs({ files, timeoutMs }), {
    encoding: 'utf8', env, cwd: relative ? FIXTURES : undefined,
  });
  return { status: result.status, stdout: result.stdout };
}

test('a passing file reports its test count', () => {
  const { status, stdout } = run(['pass.js']);
  assert.strictEqual(status, 0);
  assert.match(stdout, /✅ .*pass\.js: 🧪 2 tests, ✅ 2 passing/);
});

test('a failing file is marked, counted, and names the failed test', () => {
  const { status, stdout } = run(['fail.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*fail\.js: 🧪 2 tests, ✅ 1 passing, ❌ 1 failing/);
  // The compared values are on later lines of the error; the short form must keep them.
  assert.match(stdout, /this one fails: one is not two 1 !== 2/);
});

test('a file that crashes on load fails and shows its stack trace', () => {
  const { status, stdout } = run(['crash.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*crash\.js: stopped before reporting results/);
  assert.match(stdout, /Cannot find module/);
});

test('a crash keeps its stack trace when the file is named by a relative path', () => {
  // Node labels stderr events with the path as typed and test events with the
  // absolute path. Until the reporter matched them up, the trace was dropped.
  const { status, stdout } = run(['crash.js'], {}, { relative: true });
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*crash\.js: stopped before reporting results/);
  assert.match(stdout, /Cannot find module/);
});

test('a file in which no test ran fails', () => {
  const { status, stdout } = run(['empty.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*empty\.js: no tests ran/);
});

test('a skipped test shows in the line and warns', () => {
  const { status, stdout } = run(['skip.js']);
  assert.strictEqual(status, 0);
  assert.match(stdout, /⚠️ .*skip\.js: 🧪 2 tests, ✅ 1 passing, ⏭️ +1 skipped/);
});

test('a failing before hook fails every test, never "0 tests"', () => {
  const { status, stdout } = run(['hook-fail.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*hook-fail\.js: 🧪 2 tests, ❌ 2 failing/);
  assert.match(stdout, /browser did not start/);
});

test('several files end with the overall summary; one file does not', () => {
  assert.match(run(['pass.js', 'fail.js']).stdout, /Overall Test Summary/);
  assert.doesNotMatch(run(['pass.js']).stdout, /Overall Test Summary/);
});

test('verbose lists every test by name', () => {
  const { stdout } = run(['pass.js'], { UNIT_REPORT_VERBOSE: '1' });
  assert.strictEqual((stdout.match(/^ {4}✅ /gm) || []).length, 2);
});

test('fileOutcome treats missing counts as a failure', () => {
  assert.strictEqual(fileOutcome({ counts: null, fileFailed: true }).passed, false);
  assert.strictEqual(fileOutcome({ counts: null }).passed, false);
});

test('a file that throws after its tests passed fails', () => {
  // Node fails the file, and its counts still say every test passed.
  const { status, stdout } = run(['late-throw.js', 'pass.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*late-throw\.js: 🧪 1 test, ✅ 1 passing, ❌ failed outside its tests/);
  assert.match(stdout, /thrown after the tests finished/);
  assert.doesNotMatch(stdout, /All tests passed/);
});

test('a failing after hook fails the file, keeps its counts, and shows the error', () => {
  const { status, stdout } = run(['after-fail.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*after-fail\.js: 🧪 1 test, ✅ 1 passing, ❌ failed outside its tests/);
  assert.match(stdout, /cleanup blew up/);
});

test('a file whose tests are all skipped or todo fails: no test ran', () => {
  const { status, stdout } = run(['all-skipped.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*all-skipped\.js: no tests ran \(2 skipped\)/);
});

test('a test that never settles is stopped by the timeout and named', () => {
  const { status, stdout } = run(['hang.js'], {}, { timeoutMs: 300 });
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*hang\.js: 🧪 1 test, ❌ 1 failing/);
  assert.match(stdout, /never settles: test timed out after 300ms/);
});

test('the node --test arguments carry a timeout by default', () => {
  assert.ok(nodeTestArgs({ files: ['x.js'] }).includes('--test-timeout=120000'));
});

test('a failure nested in a group and a subtest fails the file and is named', () => {
  const { status, stdout } = run(['nested.js']);
  assert.strictEqual(status, 1);
  assert.match(stdout, /❌ .*nested\.js: /);
  assert.match(stdout, /inner fails: deep failure/);
});

test('two files with the same basename are reported as two files', () => {
  const { status, stdout } = run(['pass.js', path.join('twin', 'pass.js')]);
  assert.strictEqual(status, 0);
  assert.match(stdout, /pass\.js: 🧪 2 tests, ✅ 2 passing/);
  assert.match(stdout, /pass\.js: 🧪 1 test, ✅ 1 passing/);
  assert.match(stdout, /Total tests: 2/);
});
