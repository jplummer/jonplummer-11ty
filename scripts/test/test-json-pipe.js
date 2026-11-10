#!/usr/bin/env node

/**
 * Guards test-runner IPC: large JSON over a pipe must include both markers.
 * Regressions covered:
 * - async stdout.write + process.exit() before drain (~64KB truncated)
 * - single fs.writeSync on non-blocking pipe (partial write, end marker dropped)
 * Also guards the runner's result icon: a test file that crashes reports no
 * issues, and until 2026-11-09 the runner showed it a ✅ over its stack trace.
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const { test } = require('node:test');
const { resultIcon } = require('../utils/test-results');

const HELPER = path.join(__dirname, 'fixtures', 'emit-large-test-json.js');

function capturePipedJson() {
  return new Promise((resolve, reject) => {
    let stdoutData = '';
    const child = spawn(process.execPath, [HELPER], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, TEST_RUNNER: 'true' },
    });
    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });
    child.stderr.on('data', () => {});
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdoutData });
    });
  });
}

test('large JSON survives a piped stdout', async () => {
  const { code, stdoutData } = await capturePipedJson();
  assert.strictEqual(code, 0, `helper exit code ${code}`);
  assert.ok(
    stdoutData.includes('__TEST_JSON_START__'),
    'missing __TEST_JSON_START__'
  );
  assert.ok(
    stdoutData.length > 65536,
    `fixture must exceed pipe buffer (got ${stdoutData.length} bytes)`
  );
  assert.ok(
    stdoutData.includes('__TEST_JSON_END__'),
    `missing __TEST_JSON_END__ (got ${stdoutData.length} bytes — likely truncated)`
  );
  const start = stdoutData.indexOf('__TEST_JSON_START__') + '__TEST_JSON_START__'.length;
  const end = stdoutData.indexOf('__TEST_JSON_END__');
  const parsed = JSON.parse(stdoutData.slice(start, end).trim());
  assert.ok(parsed.files && parsed.files.length >= 800, 'expected large files array');
});

test('result icon follows the exit code', () => {
  assert.strictEqual(resultIcon({ issues: 0, warnings: 0 }, 0), '✅');
  assert.strictEqual(resultIcon({ issues: 0, warnings: 2 }, 0).trim(), '⚠️');
  assert.strictEqual(resultIcon({ issues: 1, warnings: 2 }, 1), '❌');
  assert.strictEqual(resultIcon({ issues: 0, warnings: 0 }, 1), '❌', 'non-zero exit with no issues reported');
  assert.strictEqual(resultIcon({ issues: 0, warnings: 0 }, null), '❌', 'killed by a signal');
});
