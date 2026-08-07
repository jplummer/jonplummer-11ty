#!/usr/bin/env node
/**
 * Emits a large test-result JSON via outputResult (same path as seo-meta).
 * Used by scripts/test/test-json-pipe.js to verify piped stdout is complete.
 */
const { createTestResult, addFile, outputResult } = require('../../utils/test-results');
const { outputAndExit } = require('../../utils/test-runner-helper');

const result = createTestResult('pipe-fixture', 'Pipe fixture');
for (let i = 0; i < 500; i++) {
  const f = addFile(result, `_site/fake/${i}/index.html`, `fake/${i}/index.html`);
  // keep empty issues/warnings like passing SEO rows
  void f;
}
outputAndExit(result);
