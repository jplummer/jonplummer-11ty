#!/usr/bin/env node

/**
 * Guards generateOgImageFilename(): post PNG names follow the source
 * YYYY-MM-DD-* filename so UTC midnight / date-only front matter cannot
 * shift the calendar day or double-prefix the slug.
 */

const assert = require('assert');
const path = require('path');
const { generateOgImageFilename } = require('../utils/og-image-filename');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const POST = path.join('src', '_posts', '2026', '2026-08-12-care-has-to-show-up-in-the-product.md');
const CRITIQUE = path.join('src', '_posts', '2025', '2025-12-31-engaging-in-critique.md');

function runUnitAssertions(result) {
  const file = addFile(result, 'scripts/utils/og-image-filename.js', 'og-image-filename');

  function check(name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'og-image-filename',
        message: `${name}: ${err.message}`,
        ruleId: 'og-image-filename',
      });
    }
  }

  check('dated post filename wins over date-only front matter', () => {
    const name = generateOgImageFilename({ tags: ['post'], date: '2026-08-12' }, POST);
    assert.strictEqual(name, '2026-08-12-care-has-to-show-up-in-the-product.png');
  });

  check('dated post filename wins over UTC midnight ISO front matter', () => {
    const name = generateOgImageFilename(
      { tags: ['post'], date: '2025-12-31T00:00:00.000Z' },
      CRITIQUE
    );
    assert.strictEqual(name, '2025-12-31-engaging-in-critique.png');
  });

  check('dated post filename wins over offset timestamp front matter', () => {
    const name = generateOgImageFilename(
      { tags: ['post'], date: '2026-08-12T12:00:00-07:00' },
      POST
    );
    assert.strictEqual(name, '2026-08-12-care-has-to-show-up-in-the-product.png');
  });
}

runTest({
  testType: 'og-image-filename',
  testName: 'OG Image Filename',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
});
