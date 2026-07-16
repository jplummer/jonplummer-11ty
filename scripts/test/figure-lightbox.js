#!/usr/bin/env node

const assert = require('assert');
const {
  largestUrlFromSrcset,
  largestUrlFromAttributes,
} = require('../../eleventy/utils/largest-srcset-url');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

function runUnitAssertions(result) {
  const fileObj = addFile(result, 'eleventy/utils/largest-srcset-url.js', 'largest-srcset-url.js');

  function check(name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(fileObj, {
        type: 'figure-lightbox-unit',
        message: `${name}: ${err.message}`,
        ruleId: 'figure-lightbox-unit',
      });
    }
  }

  check('picks largest w descriptor', () => {
    assert.strictEqual(
      largestUrlFromSrcset('/a-400.webp 400w, /a-1600.webp 1600w, /a-800.webp 800w'),
      '/a-1600.webp'
    );
  });

  check('returns null for empty srcset', () => {
    assert.strictEqual(largestUrlFromSrcset(''), null);
    assert.strictEqual(largestUrlFromSrcset(null), null);
  });

  check('prefers widest source srcset over img src', () => {
    assert.strictEqual(
      largestUrlFromAttributes({
        src: '/fallback.jpeg',
        srcset: '/img-800.jpeg 800w',
        sourceSrcsets: ['/img-400.webp 400w, /img-1600.webp 1600w'],
      }),
      '/img-1600.webp'
    );
  });

  check('falls back to src when no srcset', () => {
    assert.strictEqual(
      largestUrlFromAttributes({ src: '/only.jpeg', srcset: '', sourceSrcsets: [] }),
      '/only.jpeg'
    );
  });
}

runTest({
  testType: 'figure-lightbox',
  testName: 'Figure lightbox',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
  },
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
