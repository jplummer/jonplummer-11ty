#!/usr/bin/env node

/**
 * Guards test-runner IPC: large JSON over a pipe must include both markers
 * (regression: process.exit before stdout drained truncated SEO output ~64KB).
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

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

async function validate(result) {
  const fileObj = addFile(result, 'scripts/utils/test-results.js', 'test-json-pipe');

  try {
    const { code, stdoutData } = await capturePipedJson();
    assert.strictEqual(code, 0, `helper exit code ${code}`);
    assert.ok(
      stdoutData.includes('__TEST_JSON_START__'),
      'missing __TEST_JSON_START__'
    );
    assert.ok(
      stdoutData.includes('__TEST_JSON_END__'),
      `missing __TEST_JSON_END__ (got ${stdoutData.length} bytes — likely truncated)`
    );
    const start = stdoutData.indexOf('__TEST_JSON_START__') + '__TEST_JSON_START__'.length;
    const end = stdoutData.indexOf('__TEST_JSON_END__');
    const parsed = JSON.parse(stdoutData.slice(start, end).trim());
    assert.ok(parsed.files && parsed.files.length >= 400, 'expected large files array');
  } catch (err) {
    addIssue(fileObj, {
      type: 'test-json-pipe',
      message: err.message,
      ruleId: 'test-json-pipe-complete',
    });
  }
}

runTest({
  testType: 'test-json-pipe',
  testName: 'Test JSON pipe completeness',
  requiresSite: false,
  validateFn: validate,
});
