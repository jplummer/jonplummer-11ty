#!/usr/bin/env node
/**
 * Emits a large test-result JSON via outputResult (same path as seo-meta).
 * Used by scripts/test/test-json-pipe.js to verify piped stdout is complete.
 *
 * Must exceed the typical Unix pipe buffer (~64KB): a single writeSync to a
 * non-blocking stdout fd returns after filling the buffer and drops the rest.
 */
const { createTestResult, addFile, outputResult } = require('../../utils/test-results');
const { outputAndExit } = require('../../utils/test-runner-helper');

const result = createTestResult('pipe-fixture', 'Pipe fixture');
// ~1000 short paths → well over 64KB compact JSON (500 was ~59KB and missed the bug)
for (let i = 0; i < 1000; i++) {
  const f = addFile(result, `_site/fake/${i}/index.html`, `fake/${i}/index.html`);
  // keep empty issues/warnings like passing SEO rows
  void f;
}
outputAndExit(result);
