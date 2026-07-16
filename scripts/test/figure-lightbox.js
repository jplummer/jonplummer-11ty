#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  largestUrlFromSrcset,
  largestUrlFromAttributes,
} = require('../../eleventy/utils/largest-srcset-url');
const { applyFigureLightboxLinks } = require('../../eleventy/utils/figure-lightbox-transform');
const { addFile, addIssue } = require('../utils/test-results');
const { runTest } = require('../utils/test-runner-helper');

function runUnitAssertions(result) {
  const fileObj = addFile(result, 'eleventy/utils/largest-srcset-url.js', 'largest-srcset-url.js');
  const transformFile = addFile(
    result,
    'eleventy/utils/figure-lightbox-transform.js',
    'figure-lightbox-transform.js'
  );

  function check(file, name, fn) {
    try {
      fn();
    } catch (err) {
      addIssue(file, {
        type: 'figure-lightbox-unit',
        message: `${name}: ${err.message}`,
        ruleId: 'figure-lightbox-unit',
      });
    }
  }

  check(fileObj, 'picks largest w descriptor', () => {
    assert.strictEqual(
      largestUrlFromSrcset('/a-400.webp 400w, /a-1600.webp 1600w, /a-800.webp 800w'),
      '/a-1600.webp'
    );
  });

  check(fileObj, 'returns null for empty srcset', () => {
    assert.strictEqual(largestUrlFromSrcset(''), null);
    assert.strictEqual(largestUrlFromSrcset(null), null);
  });

  check(fileObj, 'prefers widest source srcset over img src', () => {
    assert.strictEqual(
      largestUrlFromAttributes({
        src: '/fallback.jpeg',
        srcset: '/img-800.jpeg 800w',
        sourceSrcsets: ['/img-400.webp 400w, /img-1600.webp 1600w'],
      }),
      '/img-1600.webp'
    );
  });

  check(fileObj, 'falls back to src when no srcset', () => {
    assert.strictEqual(
      largestUrlFromAttributes({ src: '/only.jpeg', srcset: '', sourceSrcsets: [] }),
      '/only.jpeg'
    );
  });

  check(transformFile, 'wraps picture in main figure with largest href', () => {
    const input = `
      <main>
        <figure>
          <picture>
            <source srcset="/a-400.webp 400w, /a-1600.webp 1600w" type="image/webp">
            <img src="/a-800.jpeg" srcset="/a-800.jpeg 800w" alt="Diagram">
          </picture>
          <figcaption>A diagram</figcaption>
        </figure>
      </main>`;
    const out = applyFigureLightboxLinks(input);
    assert.match(out, /class="figure-lightbox-trigger"/);
    assert.match(out, /href="\/a-1600\.webp"/);
    assert.match(out, /<a class="figure-lightbox-trigger"[^>]*>\s*<picture>/);
  });

  check(transformFile, 'skips masthead-preview-strip', () => {
    const input = `<main><figure class="masthead-preview-strip"><img src="/x.png" alt=""></figure></main>`;
    const out = applyFigureLightboxLinks(input);
    assert.doesNotMatch(out, /figure-lightbox-trigger/);
  });

  check(transformFile, 'is idempotent', () => {
    const input = `
      <main><figure>
        <picture><img src="/a.jpeg" srcset="/a-1600.jpeg 1600w" alt=""></picture>
      </figure></main>`;
    const once = applyFigureLightboxLinks(input);
    const twice = applyFigureLightboxLinks(once);
    assert.strictEqual(once, twice);
  });
}

function runSmokeAssertions(result) {
  const siteRoot = path.join(__dirname, '../../_site');
  if (!fs.existsSync(siteRoot)) return;

  const smokeFile = addFile(result, '_site', 'figure-lightbox-smoke');
  const sampleCandidates = [
    '2026/03/06/invoca-ia-vision/index.html',
    '2026/02/20/call-review-console/index.html',
    '2025/08/07/field-guide-to-problem-statements/index.html',
  ];

  let html = null;
  let used = null;
  for (const rel of sampleCandidates) {
    const full = path.join(siteRoot, rel);
    if (fs.existsSync(full)) {
      html = fs.readFileSync(full, 'utf8');
      used = rel;
      break;
    }
  }

  if (!html) return;

  if (!html.includes('/assets/js/figure-lightbox.js')) {
    addIssue(smokeFile, {
      type: 'figure-lightbox-smoke',
      message: `${used}: missing figure-lightbox.js script tag`,
      ruleId: 'figure-lightbox-script',
    });
  }
  if (!html.includes('id="figure-lightbox"')) {
    addIssue(smokeFile, {
      type: 'figure-lightbox-smoke',
      message: `${used}: missing #figure-lightbox dialog`,
      ruleId: 'figure-lightbox-dialog',
    });
  }
  if (!html.includes('figure-lightbox-trigger')) {
    addIssue(smokeFile, {
      type: 'figure-lightbox-smoke',
      message: `${used}: expected at least one figure-lightbox-trigger`,
      ruleId: 'figure-lightbox-trigger',
    });
  }
}

runTest({
  testType: 'figure-lightbox',
  testName: 'Figure lightbox',
  requiresSite: false,
  validateFn: async (result) => {
    runUnitAssertions(result);
    runSmokeAssertions(result);
  },
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
