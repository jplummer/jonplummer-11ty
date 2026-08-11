#!/usr/bin/env node

/**
 * Guards generateOgImageFilename(): date-only front matter must use calendar
 * YYYY-MM-DD parts, not `new Date('YYYY-MM-DD')` (UTC midnight → local-day shift).
 */

const assert = require('assert');
const path = require('path');
const { generateOgImageFilename } = require('../utils/og-image-filename');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

const POST = path.join('src', '_posts', '2026', '2026-08-12-care-has-to-show-up-in-the-product.md');

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

  check('date-only string keeps calendar day in filename', () => {
    const name = generateOgImageFilename({ tags: ['post'], date: '2026-08-12' }, POST);
    assert.strictEqual(name, '2026-08-12-care-has-to-show-up-in-the-product.png');
  });

  check('ISO timestamp with offset uses local calendar components', () => {
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
