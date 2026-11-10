#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  largestUrlFromSrcset,
  largestUrlFromAttributes,
} = require('../../eleventy/utils/largest-srcset-url');
const { applyFigureLightboxLinks } = require('../../eleventy/utils/figure-lightbox-transform');
const { test } = require('node:test');

test('picks largest w descriptor', () => {
  assert.strictEqual(
    largestUrlFromSrcset('/a-400.webp 400w, /a-1600.webp 1600w, /a-800.webp 800w'),
    '/a-1600.webp'
  );
});

test('returns null for empty srcset', () => {
  assert.strictEqual(largestUrlFromSrcset(''), null);
  assert.strictEqual(largestUrlFromSrcset(null), null);
});

test('prefers widest source srcset over img src', () => {
  assert.strictEqual(
    largestUrlFromAttributes({
      src: '/fallback.jpeg',
      srcset: '/img-800.jpeg 800w',
      sourceSrcsets: ['/img-400.webp 400w, /img-1600.webp 1600w'],
    }),
    '/img-1600.webp'
  );
});

test('falls back to src when no srcset', () => {
  assert.strictEqual(
    largestUrlFromAttributes({ src: '/only.jpeg', srcset: '', sourceSrcsets: [] }),
    '/only.jpeg'
  );
});

test('wraps picture in main figure with largest href', () => {
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

test('is idempotent', () => {
  const input = `
      <main><figure>
        <picture><img src="/a.jpeg" srcset="/a-1600.jpeg 1600w" alt=""></picture>
      </figure></main>`;
  const once = applyFigureLightboxLinks(input);
  const twice = applyFigureLightboxLinks(once);
  assert.strictEqual(once, twice);
});

// When a build is on disk, also look at one built page that has figures.
// Skipped without _site/, so this file still runs before a first build.
// If _site/ is there and none of the samples are, that is a failure: until
// 2026-11-09 this returned quietly, and it had checked nothing since the
// portfolio pieces moved to /portfolio/<slug>/ the day before.
const SITE_ROOT = path.join(__dirname, '../../_site');
const SAMPLE_CANDIDATES = [
  'portfolio/invoca-ia-vision/index.html',
  'portfolio/call-review-console/index.html',
  '2026/09/04/simple-is-really/index.html',
];

test('a built page has the lightbox script, dialog, and a trigger', { skip: fs.existsSync(SITE_ROOT) ? false : 'no _site/ to look at' }, () => {
  const used = SAMPLE_CANDIDATES.find((rel) => fs.existsSync(path.join(SITE_ROOT, rel)));
  assert.ok(used, `none of the sample pages exist in _site/; update SAMPLE_CANDIDATES: ${SAMPLE_CANDIDATES.join(', ')}`);
  const html = fs.readFileSync(path.join(SITE_ROOT, used), 'utf8');
  assert.ok(html.includes('/assets/js/figure-lightbox.js'), `${used}: missing figure-lightbox.js script tag`);
  assert.ok(html.includes('id="figure-lightbox"'), `${used}: missing #figure-lightbox dialog`);
  assert.ok(html.includes('figure-lightbox-trigger'), `${used}: expected at least one figure-lightbox-trigger`);
});
